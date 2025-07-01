// src/crypto/generate.ts

import { KeyType } from '../chain';
import { getCurve } from './curves';
import nacl from 'tweetnacl';

/**
 * Generate a new private key for given type.
 * @internal
 */
export function generate(type: KeyType): Uint8Array {

    switch (type) {
        case KeyType.ED: // ED25519 private key via tweetnacl
            return nacl.sign.keyPair().secretKey; // 64-byte secretKey = 32b seed + 32b pubkey

        case KeyType.EM:
            throw new Error('KeyType.EM is not supported for key generation.');

        default: {
            // ECDSA curves
            const curve = getCurve(type);
            const privkey = curve.genKeyPair().getPrivate();
            return privkey.toArrayLike(Uint8Array as any, 'be', 32);
        }
    }
}