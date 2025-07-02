import { ethers } from 'ethers';
import { Bytes, KeyType, PublicKey } from '../chain';
import { getCurve } from './curves';

/**
 * Recover compressed public key from signature and recovery id.
 * @internal
 */
export function recover(
    signature: Uint8Array, 
    message: Uint8Array, 
    type: KeyType
): PublicKey {
    switch (type) {
        case KeyType.ED:
            throw new Error('ED25519 does not support public key recovery');

        case KeyType.EM: { // let ethers handle EIP-191 prefix, EIP-155 chain-ids, recovery-id parsing, etc.
            const sigBytes = ethers.utils.arrayify(signature);
            const msgHash = ethers.utils.hashMessage(message)
            const uncompressed = ethers.utils.recoverPublicKey(msgHash, sigBytes)
            const compressed = ethers.utils.computePublicKey(uncompressed, true);
            return new PublicKey(KeyType.EM, new Bytes(ethers.utils.arrayify(compressed)));
        }

        default: {
            const curve = getCurve(type);
            const recid = signature[0] - 31;
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33);
            const point = curve.recoverPubKey(message, { r, s }, recid);
            return new PublicKey(type, new Bytes(point.encodeCompressed()));
        }
    }
}
