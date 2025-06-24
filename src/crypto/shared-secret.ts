// src/crypto/shared-secret.ts

import { KeyType } from '../chain';
import { getCurve } from './curves';

/**
 * Derive shared secret for key pair.
 * @internal
 */
export function sharedSecret(
    privkey: Uint8Array,
    pubkey: Uint8Array,
    type: KeyType
): Uint8Array {
    switch (type) {
        case KeyType.ED:
            // ED25519 does not support ECDH-derived shared secrets
            throw new Error('Shared secret (ECDH) not supported for ED25519; convert to X25519 first');

        default: {
            // ECDSA curves (K1, R1, EM)
            const curve = getCurve(type);
            const priv = curve.keyFromPrivate(privkey);
            const pub = curve.keyFromPublic(pubkey).getPublic();
            return priv.derive(pub).toArrayLike(Uint8Array as any, 'be');
        }
    }
}