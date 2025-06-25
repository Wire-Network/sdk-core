import { ec } from 'elliptic';
import { getCurve } from './curves';
import { KeyType, SignatureParts } from '../chain';
import nacl from 'tweetnacl';

/**
 * Sign digest using private key.
 * @internal
 */
export function sign(secret: Uint8Array, message: Uint8Array, type: KeyType): SignatureParts {
    switch(type){
        case KeyType.ED: { // ED25519 detached signature via tweetnacl
            const sigBytes = nacl.sign.detached(message, secret);
            const r = sigBytes.slice(0, 32);
            const s = sigBytes.slice(32, 64);
            return { type, r, s, recid: 0 };
        }

        default: { // ECDSA curves (K1, R1, EM)
            const curve = getCurve(type);
            const key = curve.keyFromPrivate(secret);
            let sig: ec.Signature;
            let r: Uint8Array;
            let s: Uint8Array;

            if (type === KeyType.K1) {
                let attempt = 1;

                do {
                    sig = key.sign(message, { canonical: true, pers: [attempt++] });
                    r = sig.r.toArrayLike(Uint8Array as any, 'be', 32);
                    s = sig.s.toArrayLike(Uint8Array as any, 'be', 32);
                } while (!isCanonical(r, s));
            } else {
                sig = key.sign(message, { canonical: true });
                r = sig.r.toArrayLike(Uint8Array as any, 'be', 32);
                s = sig.s.toArrayLike(Uint8Array as any, 'be', 32);
            }

            return { type, r, s, recid: sig.recoveryParam || 0 };
        }
    }
}

/**
 * Here be dragons
 * - https://github.com/steemit/steem/issues/1944
 * - https://github.com/EOSIO/eos/issues/6699
 * @internal
 */
function isCanonical(r: Uint8Array, s: Uint8Array) {
    return (
        !(r[0] & 0x80) &&
        !(r[0] === 0 && !(r[1] & 0x80)) &&
        !(s[0] & 0x80) &&
        !(s[0] === 0 && !(s[1] & 0x80))
    );
}
