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

        case KeyType.EM: {
            // wire: [vWire(31/32)‖r(32)‖s(32)]
            const vRaw = signature[0] - 4; // 27/28
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33, 65);

            const sigHex = ethers.utils.hexlify(
                Uint8Array.from([...r, ...s, vRaw])
            );
            const msgHash = ethers.utils.hashMessage(message);
            const uncompressed = ethers.utils.recoverPublicKey(msgHash, sigHex);
            const compressed = ethers.utils.computePublicKey(uncompressed, true); // hex
            return new PublicKey(KeyType.EM, new Bytes(ethers.utils.arrayify(compressed)));
        }

        default: { // K1 / R1
            const curve = getCurve(type);
            // wire: [vWire(31/32)‖r‖s]
            const recid = signature[0] - 31;
            const r = signature.subarray(1, 33);
            const s = signature.subarray(33, 65);

            const point = curve.recoverPubKey(message, { r, s }, recid);
            const compressed = Uint8Array.from(point.encode('array', true)); // 33 bytes
            return new PublicKey(type, new Bytes(compressed));
        }
    }
}
