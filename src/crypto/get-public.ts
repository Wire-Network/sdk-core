import { KeyType } from '../chain';
import { getCurve } from './curves';
import { getSodium } from './sodium';
const sodium = getSodium();

/**
 * Get public key corresponding to given private key.
 * @internal
 */
export function getPublic(privkey: Uint8Array, type: KeyType) {
    switch(type) {
        case KeyType.ED: // ED25519 public key via libsodium
            return sodium.crypto_sign_seed_keypair(privkey).publicKey;
        
        default: { // ECDSA public key via elliptic
            const curve = getCurve(type);
            const key = curve.keyFromPrivate(privkey);
            const point = key.getPublic();
            return new Uint8Array(point.encodeCompressed());
        }
    }
}