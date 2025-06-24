// src/crypto/generate.ts

import { KeyType } from '../chain';
import { getCurve } from './curves';
import { getSodium } from './sodium';
const sodium = getSodium();

/**
 * Generate a new private key for given type.
 * @internal
 */
export function generate(type: KeyType): Uint8Array {
    switch (type) {
        case KeyType.ED: {
            // ED25519 private key via libsodium
            const kp = sodium.crypto_sign_keypair();
            return kp.privateKey;
        }

        default: {
            // ECDSA curves
            const curve = getCurve(type);
            const privkey = curve.genKeyPair().getPrivate();
            return privkey.toArrayLike(Uint8Array as any, 'be', 32);
        }
    }
}