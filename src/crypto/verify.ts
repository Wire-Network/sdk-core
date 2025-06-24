import { getCurve } from './curves';
import { KeyType } from '../chain';
import { getSodium } from './sodium';
const sodium = getSodium();

/**
 * Verify signature using message and public key.
 * @internal
 */
export function verify(
    signature: Uint8Array,
    message: Uint8Array,
    pubkey: Uint8Array,
    type: KeyType
): boolean {
    switch (type) {
        case KeyType.ED: // ED25519 detached verification via libsodium
            return sodium.crypto_sign_verify_detached(signature, message, pubkey);

        default: { // ECDSA verification using elliptic
            const curve = getCurve(type);
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33, 65);
            return curve.verify(message, { r, s }, pubkey as any);
        }
    }
}