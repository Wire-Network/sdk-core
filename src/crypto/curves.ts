import {ec} from 'elliptic';
import { KeyType } from '../chain';

const curves: {[type: string]: ec} = {};

/**
 * Get curve for key type.
 * @internal
 */
export function getCurve(type: KeyType): ec {
    let rv = curves[type];

    if (!rv) {
        switch (type) {
            case KeyType.K1:
            case KeyType.EM:
                rv = curves[type] = new ec('secp256k1');
                break;
            case KeyType.R1:
                rv = curves[type] = new ec('p256');
                break;
            case KeyType.ED:
                throw new Error('ED25519 keys are not supported via elliptic; use libsodium for ED-based operations');
            default:
                throw new Error(`Unknown curve type: ${type}`);
        }
    }

    return rv;
}
