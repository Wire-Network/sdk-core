// src/crypto/signature.ts

import { ABIDecoder } from '../serializer/decoder';
import { ABIEncoder } from '../serializer/encoder';
import { ABISerializableObject } from '../serializer/serializable';

import { Base58 } from '../base58';
import { isInstanceOf } from '../utils';

import { recover } from '../crypto/recover';
import { verify } from '../crypto/verify';

import { Bytes, BytesType, Checksum256, Checksum256Type, KeyType, PublicKey } from '../';

export type SignatureType =
    | Signature
    | SignatureParts
    | string;

export type SignatureParts = { type: string; r: Uint8Array; s: Uint8Array; recid: number };

export class Signature implements ABISerializableObject {
    static abiName = 'signature';

    /** Type, e.g. `K1` or `ED` */
    type: KeyType;
    /** Signature data. */
    data: Bytes;

    /** Create Signature object from representing types. */
    static from(value: SignatureType): Signature {
        if (isInstanceOf(value, Signature)) {
            return value;
        }

        if (typeof value === 'object' && 'r' in value && 's' in value) {
            const data = new Uint8Array(1 + 32 + 32);
            let recid = value.recid;
            const type = KeyType.from(value.type);

            if (
                type === KeyType.K1 ||
                type === KeyType.R1 ||
                type === KeyType.EM
            ) {
                recid += 31;
            }

            data[0] = recid;
            data.set(value.r, 1);
            data.set(value.s, 33);
            return new Signature(type, new Bytes(data));
        }

        if (typeof value !== 'string' || !value.startsWith('SIG_')) {
            throw new Error('Invalid signature string');
        }

        const parts = value.split('_');

        if (parts.length !== 3) {
            throw new Error('Invalid signature string');
        }

        const type = KeyType.from(parts[1]);
        // ECDSA signatures are 65 bytes; ED25519 signatures are 64 bytes
        const size =
            type === KeyType.K1 || type === KeyType.R1 || type === KeyType.EM ? 65 :
                type === KeyType.ED ? 64 :
                    undefined;
        const data = Base58.decodeRipemd160Check(parts[2], size, type);
        return new Signature(type, data);
    }

    /** @internal */
    static fromABI(decoder: ABIDecoder): Signature {
        const type = KeyType.from(decoder.readByte());

        if (type === KeyType.WA) {
            const startPos = decoder.getPosition();
            decoder.advance(65); // compact_signature
            decoder.advance(decoder.readVaruint32()); // auth_data
            decoder.advance(decoder.readVaruint32()); // client_json
            const len = decoder.getPosition() - startPos;
            decoder.setPosition(startPos);
            const data = Bytes.from(decoder.readArray(len));
            return new Signature(KeyType.WA, data);
        }

        // Read 64 bytes for ED25519, 65 bytes for ECDSA
        const len = type === KeyType.ED ? 64 : 65;
        const arr = decoder.readArray(len);
        return new Signature(type, new Bytes(arr));
    }

    /** @internal */
    constructor(type: KeyType, data: Bytes) {
        this.type = type;
        this.data = data;
    }

    equals(other: SignatureType): boolean {
        const otherSig = Signature.from(other);
        return this.type === otherSig.type && this.data.equals(otherSig.data);
    }

    /** Recover public key from given message digest. */
    recoverDigest(digest: Checksum256Type): PublicKey {
        digest = Checksum256.from(digest);
        const compressed = recover(this.data.array, digest.array, this.type);
        return PublicKey.from({ compressed, type: this.type });
    }

    /** Recover public key from given message. */
    recoverMessage(message: BytesType): PublicKey {
        return this.recoverDigest(Checksum256.hash(message));
    }

    /** Verify this signature with given message digest and public key. */
    verifyDigest(digest: Checksum256Type, publicKey: PublicKey): boolean {
        digest = Checksum256.from(digest);
        return verify(this.data.array, digest.array, publicKey.data.array, this.type);
    }

    /** Verify this signature with given message and public key. */
    verifyMessage(message: BytesType, publicKey: PublicKey): boolean {
        return this.verifyDigest(Checksum256.hash(message), publicKey);
    }

    /** Base58check encoded string representation of this signature (`SIG_<type>_<data>`). */
    toString(): string {
        return `SIG_${this.type}_${Base58.encodeRipemd160Check(this.data, this.type)}`;
    }

    /** @internal */
    toABI(encoder: ABIEncoder): void {
        encoder.writeByte(KeyType.indexFor(this.type));
        encoder.writeArray(this.data.array);
    }

    /** @internal */
    toJSON(): string {
        return this.toString();
    }
}