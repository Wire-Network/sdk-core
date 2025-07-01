import { getCurve } from './curves';
import { KeyType } from '../chain';
import nacl from 'tweetnacl';
import { ethers } from 'ethers';

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
        case KeyType.ED: // ED25519 detached verification via tweetnacl
            return nacl.sign.detached.verify(message, signature, pubkey);

        case KeyType.EM: {
            const recovered = ethers.utils.verifyMessage(message, signature)
            const expected = ethers.utils.computeAddress(pubkey)
            return recovered.toLowerCase() === expected.toLowerCase()
        }

        default: { // ECDSA verification using elliptic
            const curve = getCurve(type);
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33, 65);
            return curve.verify(message, { r, s }, pubkey as any);
        }
    }
}