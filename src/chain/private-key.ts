import { Base58 } from '../base58';
import { isInstanceOf } from '../utils';

import { getPublic } from '../crypto/get-public';
import { sharedSecret } from '../crypto/shared-secret';
import { sign } from '../crypto/sign';
import { generate } from '../crypto/generate';

import { ec as EC } from 'elliptic';

import { ethers } from 'ethers';

import {
    Bytes,
    BytesType,
    Checksum256,
    Checksum256Type,
    Checksum512,
    Crypto,
    KeyType,
    PublicKey,
    Signature,
} from '../';

export type PrivateKeyType = PrivateKey | string;

export class PrivateKey {
    type: KeyType;
    data: Bytes;

    /** Create PrivateKey object from representing types. */
    static from(value: PrivateKeyType) {
        if (isInstanceOf(value, PrivateKey)) {
            return value;
        } else {
            return this.fromString(value);
        }
    }

    /**
     * Create PrivateKey object from a string representation.
     * Accepts WIF (5...) and Antelope/EOSIO (PVT_...) style private keys.
     */
    static fromString(string: string, ignoreChecksumError = false) {
        try {
            const { type, data } = decodeKey(string);
            return new this(type, data);
        } catch (error: any) {
            error.message = `Invalid private key (${error.message})`;

            if (
                ignoreChecksumError &&
                isInstanceOf(error, Base58.DecodingError) &&
                error.code === Base58.ErrorCode.E_CHECKSUM
            ) {
                const type = string.startsWith('PVT_R1')
                    ? KeyType.R1
                    : string.startsWith('PVT_EM')
                        ? KeyType.EM
                        : KeyType.K1;
                const data = new Bytes(error.info.data);

                if (data.length === 33) {
                    data.dropFirst();
                }

                data.zeropad(32, true);
                return new this(type, data);
            }

            throw error;
        }
    }
    /**
     * Create PrivateKey object from elliptic key pair.
     * @param privKey - Elliptic key pair.
     * @param keyType - Key type.
     * @param ec - Elliptic curve.
     * @returns PrivateKey object.
     */
    static fromElliptic(privKey: EC.KeyPair, keyType: KeyType, ec?: EC): PrivateKey {
        if (!ec) {
            ec = keyType === KeyType.K1 ? new EC('secp256k1') : new EC('p256');
        }

        return new PrivateKey(
            keyType,
            new Bytes(privKey.getPrivate().toArrayLike(Buffer, 'be', 32))
        );
    }

    /**
     * Create PrivateKey object from mnemonic phrase.
     * @param phrase - Mnemonic phrase.
     * @returns PrivateKey object.
     */
    static fromMnemonic(phrase: Array<string> | string) {
        const ec = new EC('secp256k1');
        const p = Array.isArray(phrase) ? phrase.join(' ') : phrase;
        const wallet = ethers.Wallet.fromMnemonic(p);
        const KP = ec.keyFromPrivate(Buffer.from(wallet.privateKey.slice(2), 'hex'));
        const PK = PrivateKey.fromElliptic(KP, KeyType.K1);

        return {
            username: '',
            address: wallet.address,
            private_key: PK,
        };
    }

    /**
     * Generate new PrivateKey.
     */
    static generate(type: KeyType) {
        return new PrivateKey(KeyType.from(type), new Bytes(generate(type)));
    }

    /** @internal */
    constructor(type: KeyType, data: Bytes) {
        if (
            (type === KeyType.K1 || type === KeyType.R1 || type === KeyType.EM) &&
            data.length !== 32
        ) {
            throw new Error('Invalid private key length');
        }

        if (type === KeyType.ED && data.length !== 64) {
            throw new Error('Invalid private key length for ED25519');
        }

        this.type = type;
        this.data = data;
    }

    /**
     * Sign a raw message or its digest.
     * ED25519: signs the raw message.
     * ECDSA (K1/R1/EM): signs the SHA256 digest.
     */
    signMessage(message: BytesType) {
        const raw = Bytes.from(message).array;

        if (this.type === KeyType.ED) {
            // ED25519: raw message
            return Signature.from(sign(this.data.array, raw, this.type));
        }

        // K1/R1/EM: hash first
        return this.signDigest(Checksum256.hash(message));
    }

    /** @internal */
    signDigest(digest: Checksum256Type) {
        digest = Checksum256.from(digest);
        return Signature.from(sign(this.data.array, digest.array, this.type));
    }

    /**
     * Derive the shared secret between this private key and given public key.
     */
    sharedSecret(publicKey: PublicKey) {
        const shared = sharedSecret(this.data.array, publicKey.data.array, this.type);
        return Checksum512.hash(shared);
    }

    /**
     * Get the corresponding public key.
     */
    toPublic() {
        const compressed = getPublic(this.data.array, this.type);
        return PublicKey.from({ compressed, type: this.type });
    }

    /**
     * Return WIF representation of this private key.
     */
    toWif() {
        if (this.type !== KeyType.K1 && this.type !== KeyType.EM) {
            throw new Error('Unable to generate WIF for non-k1/em key');
        }

        return Base58.encodeCheck(Bytes.from([0x80]).appending(this.data));
    }

    toElliptic(): EC.KeyPair {
        const ec = Crypto.getCurve(this.type);
        return ec.keyFromPrivate(this.data.array);
    }

    /**
     * Return the key in Antelope/EOSIO PVT_<type>_<base58check> format.
     */
    toString() {
        return `PVT_${this.type}_${Base58.encodeRipemd160Check(this.data, this.type)}`;
    }

    toJSON() {
        return this.toString();
    }
}

/** @internal */
function decodeKey(value: string) {
    const type = typeof value;

    if (type !== 'string') {
        throw new Error(`Expected string, got ${type}`);
    }

    if (value.startsWith('PVT_')) {
        // Antelope/EOSIO format
        const parts = value.split('_');

        if (parts.length !== 3) {
            throw new Error('Invalid PVT format');
        }

        const type = KeyType.from(parts[1]);
        let size: number | undefined;

        switch (type) {
            case KeyType.K1:
            case KeyType.R1:
            case KeyType.EM:
                size = 32;
                break;
        }

        const data = Base58.decodeRipemd160Check(parts[2], size, type);
        return { type, data };
    } else {
        // WIF format
        const type = KeyType.K1;
        const data = Base58.decodeCheck(value);

        if (data.array[0] !== 0x80) {
            throw new Error('Invalid WIF');
        }

        return { type, data: data.droppingFirst() };
    }
}
