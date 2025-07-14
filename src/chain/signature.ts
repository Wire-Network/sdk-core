import { ABIDecoder } from '../serializer/decoder';
import { ABIEncoder } from '../serializer/encoder';
import { ABISerializableObject } from '../serializer/serializable';

import { Base58 } from '../base58';
import { isInstanceOf } from '../utils';

import {
    Bytes,
    BytesType,
    Checksum256,
    Checksum256Type,
    Crypto,
    KeyType,
    PublicKey,
} from '../';

export type SignatureType = Signature | SignatureParts | string;

export type SignatureParts = {
    type: KeyType;
    r: Uint8Array;
    s: Uint8Array;
    recid: number;
};

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
            // ED25519 is pure 64-byte r||s
            if (value.type === KeyType.ED) {
                const data = new Uint8Array(64);
                data.set(value.r, 0);
                data.set(value.s, 32);
                return new Signature(KeyType.ED, new Bytes(data));
            }

            // everything else stays 65-byte with recid in [0]
            const data = new Uint8Array(1 + 32 + 32);
            let recid = value.recid;
            const type = KeyType.from(value.type);

            // ECDSA recid offset
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

        // string form
        if (typeof value !== 'string' || !value.startsWith('SIG_')) {
            throw new Error('Invalid signature string');
        }

        const parts = value.split('_');

        if (parts.length !== 3) {
            throw new Error('Invalid signature string');
        }

        const type = KeyType.from(parts[1]);
        // 65 for all wire-format curves (we now pad ED to 65 bytes)
        const size =
            (type === KeyType.K1 ||
                type === KeyType.R1 ||
                type === KeyType.EM ||
                type === KeyType.ED)
                ? 65
                : undefined;

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

        const length = 65;
        return new Signature(type, new Bytes(decoder.readArray(length)));
    }

    /**
     * Build a signature directly from a hex string.
     * @param hexStr  0x-prefixed or plain hex:
     *                  • 130 chars → K1/R1/EM (r‖s‖v) 
     *                  • 128 chars → ED     (r‖s)
     * @param type    KeyType.K1 | KeyType.R1 | KeyType.EM | KeyType.ED
     */
    static fromHex(hexStr: string, type: KeyType): Signature {
        const h = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
        const raw = Uint8Array.from(Buffer.from(h, 'hex'));
        return Signature.fromRaw(raw, type);
    }

    /**
     * Build a Signature from raw “[r‖s‖v]” bytes.
     * @param raw    64 bytes (ED) or 65 bytes (EM/K1/R1) in [r(32)‖s(32)‖vRaw(1)] form
     * @param type   KeyType.ED | KeyType.EM | KeyType.K1 | KeyType.R1
     */
    static fromRaw(raw: Uint8Array, type: KeyType): Signature {
        // ED25519: the raw is already [r‖s]
        if (type === KeyType.ED) {
            if (raw.length !== 64) throw new Error(`ED raw sig must be 64 bytes, got ${raw.length}`);
            // ► pad to 65 bytes with a zero at the end:
            const wire = new Uint8Array(65);
            wire.set(raw, 0);
            wire[64] = 0;
            return new Signature(type, new Bytes(wire));
        }

        // ECDSA/EIP-191: raw should be 65 bytes [r‖s‖v]
        if (raw.length !== 65) {
            throw new Error(`Raw sig must be 65 bytes for ${type}, got ${raw.length}`);
        }

        const r = raw.subarray(0, 32);
        const s = raw.subarray(32, 64);
        const vRaw = raw[64];

        // Compute the wire‐format recid byte (vWire)
        let vWire: number;

        if (type === KeyType.EM) {
            // Ethereum v (27/28) → wire recid in [31,32]
            vWire = vRaw + 4;
        } else {
            // K1/R1: raw recid (0/1) → wire recid in [31,32]
            vWire = vRaw + 31;
        }

        // Pack into [vWire‖r‖s]
        const wire = new Uint8Array(65);
        wire[0] = vWire;
        wire.set(r, 1);
        wire.set(s, 33);

        return new Signature(type, new Bytes(wire));
    }

    /**
     * @internal
     * @param type   Which curve (K1/R1/EM/ED)
     * @param data   **Wire‐format** signature bytes:
     *               - EM/K1/R1: 65 bytes `[vWire (31–34)‖r(32)‖s(32)]`
     *               - ED:       64 bytes `[r(32)‖s(32)]`
     */
    constructor(type: KeyType, data: Bytes | Uint8Array) {
        let wire: Uint8Array;

        if (type === KeyType.ED) {
            const arr = data instanceof Bytes ? data.array : data;

            if (arr.length === 64) {
                // pad to 65 so toString() and from() agree
                wire = new Uint8Array(65);
                wire.set(arr, 0);
                wire[64] = 0;
            } else if (arr.length === 65) {
                // already padded
                wire = arr;
            } else {
                throw new Error(`ED signature must be 64 or 65 bytes, got ${arr.length}`);
            }
        } else {
            // everything else: expect exactly 65 bytes already in wire-format
            const arr = data instanceof Bytes ? data.array : data;
            
            if (arr.length !== 65) {
                throw new Error(`Expected 65-byte wire format for ${type}, got ${arr.length}`);
            }

            wire = arr;
        }

        this.type = type;
        this.data = new Bytes(wire);
    }

    equals(other: SignatureType): boolean {
        const otherSig = Signature.from(other);
        return this.type === otherSig.type && this.data.equals(otherSig.data);
    }

    /** Recover public key from given message digest. */
    recoverDigest(digest: Checksum256Type): PublicKey {
        digest = Checksum256.from(digest);
        return Crypto.recover(this.data.array, digest.array, this.type);
    }

    /** Recover public key from given message. */
    recoverMessage(message: BytesType): PublicKey {
        return this.recoverDigest(Checksum256.hash(message));
    }

    /** Verify this signature with given message digest and public key. */
    verifyDigest(digest: Checksum256Type, publicKey: PublicKey): boolean {
        digest = Checksum256.from(digest);
        return Crypto.verify(this.data.array, digest.array, publicKey.data.array, this.type);
    }

    /**
     * Verify this signature against a message and public key.
     *
     * The signature.data must be in **wire-format**:
     *  - **KeyType.ED**: 64 bytes `[r||s]` (Ed25519 detached signature)
     *  - **KeyType.EM**: 65 bytes `[vWire‖r‖s]` where `vWire = ethV + 4` (Ethereum EIP-191)
     *  - **KeyType.K1/R1**: 65 bytes `[vWire‖r‖s]` where `vWire = recid + 31` (secp256k1 / R1)
     *
     * Verification logic:
     *  - **ED25519 (ED)**: verifies the raw message bytes directly via TweetNaCl.
     *  - **Ethereum (EM)**: unwraps wire-format to `[r||s||vRaw]`, applies the EIP-191 prefix + keccak256, then recovers and compares the address.
     *  - **K1/R1**: computes SHA-256(message) digest and verifies with the appropriate elliptic curve.
     *
     * @param message    The original message bytes (Uint8Array or BytesType, UTF-8 encoded if from string).
     * @param publicKey  The PublicKey instance corresponding to the signer’s key type.
     * @returns           `true` if the signature is valid, `false` otherwise.
     */
    verifyMessage(message: BytesType, publicKey: PublicKey): boolean {
        const rawMsg = Bytes.from(message).array;

        switch (this.type) {
            case KeyType.ED: {
                // ED25519: storage is [r||s||0], TweetNaCl needs exactly 64 bytes [r||s] - strip padded 0
                const sig64 = this.data.array.subarray(0, 64);
                return Crypto.verify(sig64, rawMsg, publicKey.data.array, this.type);
            }

            case KeyType.EM: {
                // 1) unwrap wire [vWire‖r‖s]
                const wire = this.data.array;
                const vRaw = wire[0] - 4; // 27 or 28
                const r = wire.subarray(1, 33);
                const s = wire.subarray(33, 65);

                // 2) rebuild raw sig [r‖s‖vRaw]
                const sig = new Uint8Array(65);
                sig.set(r, 0);
                sig.set(s, 32);
                sig[64] = vRaw;

                // 3) verify with EIP-191 prefix + keccak256
                return Crypto.verify(sig, rawMsg, publicKey.data.array, KeyType.EM);
            }

            default:
                // K1/R1 use SHA-256 digest path
                return this.verifyDigest(Checksum256.hash(message), publicKey);
        }
    }

    /** Base58check encoded string representation of this signature (`SIG_<type>_<data>`). */
    toString(): string {
        return `SIG_${this.type}_${Base58.encodeRipemd160Check(this.data, this.type)}`;
    }

    /**
     * Return the raw signature as a 0x‐prefixed hex string:
     * - EM: [r||s||v] with Ethereum v (27/28)
     * - K1/R1: [r||s||v] with secp256k1 v (0/1)
     * - ED: [r||s] (64 bytes)
     */
    toHex(): string {
        const wire = this.data.array;
        let raw: Uint8Array;

        switch (this.type) {
            case KeyType.EM: {
                // wire[0] = ethV + 4
                const ethV = wire[0] - 4; // 27 or 28
                raw = new Uint8Array(65);
                raw.set(wire.subarray(1, 33), 0);
                raw.set(wire.subarray(33, 65), 32);
                raw[64] = ethV;
                break;
            }

            case KeyType.K1 || KeyType.R1: {
                // wire[0] = k1V + 31
                const k1V = wire[0] - 31; // 0 or 1
                raw = new Uint8Array(65);
                raw.set(wire.subarray(1, 33), 0);
                raw.set(wire.subarray(33, 65), 32);
                raw[64] = k1V;
                break;
            }

            case KeyType.ED: {
                // ED is already [r||s]
                raw = wire;
                break;
            }

            default:
                throw new Error(`toHex() not supported for key type ${this.type}`);
        }

        // hex‐encode
        const hex = Array.from(raw)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return '0x' + hex;
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