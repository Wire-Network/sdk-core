import { ethers } from 'ethers';
import { Bytes, KeyType, PublicKey } from '../chain';
import { getCurve } from './curves';

/**
 * Recover public key from signature and recovery id.
 * @internal
 */
export function recover(signature: Uint8Array, message: Uint8Array, type: KeyType) {
    switch (type) {
        case KeyType.ED:
            throw new Error('ED25519 does not support public key recovery');

        case KeyType.EM: { // let ethers handle EIP-191 prefix, EIP-155 chain-ids, recovery-id parsing, etc.
            const msgHash = ethers.utils.hashMessage(message)
            const uncompressed = ethers.utils.recoverPublicKey(msgHash, signature)
            const compressed = ethers.utils.computePublicKey(uncompressed, true);
            const key =  new PublicKey(KeyType.EM, new Bytes(ethers.utils.arrayify(compressed)));
            return key.data; // Return the compressed public key bytes
        }

        default: {
            const curve = getCurve(type);
            const recid = signature[0] - 31;
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33);
            const point = curve.recoverPubKey(message, { r, s }, recid);
            return new Uint8Array(point.encodeCompressed());
        }
    }
}
