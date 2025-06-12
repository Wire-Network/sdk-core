import { ABISerializableObject } from './serializer/serializable';
import rand from 'brorand';
import { Base58 } from './base58';
import { getCurve } from './crypto/curves';
import { KeyType } from './chain';
import { ethers } from 'ethers';

export function arrayEquals(a: ArrayLike<number>, b: ArrayLike<number>) {
    const len = a.length;

    if (len !== b.length) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function arrayEquatableEquals(a: ABISerializableObject[], b: ABISerializableObject[]) {
    const len = a.length;

    if (len !== b.length) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        if (!a[i].equals(b[i])) {
            return false;
        }
    }

    return true;
}

const hexLookup: { enc?: Array<string>; dec?: Record<string, number> } = {};

function buildHexLookup() {
    hexLookup.enc = new Array<string>(0xff);
    hexLookup.dec = {};

    for (let i = 0; i <= 0xff; ++i) {
        const b = i.toString(16).padStart(2, '0');
        hexLookup.enc[i] = b;
        hexLookup.dec[b] = i;
    }
}

export function arrayToHex(array: ArrayLike<number>) {
    if (!hexLookup.enc) {
        buildHexLookup();
    }

    const len = array.length;
    const rv = new Array<string>(len);

    for (let i = 0; i < len; ++i) {
        rv[i] = hexLookup.enc![array[i]];
    }

    return rv.join('');
}

export function hexToArray(hex: string) {
    if (!hexLookup.dec) {
        buildHexLookup();
    }

    if (typeof hex !== 'string') {
        throw new Error('Expected string containing hex digits');
    }

    if (hex.length % 2) {
        throw new Error('Odd number of hex digits');
    }

    hex = hex.toLowerCase();
    const len = hex.length / 2;
    const result = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        const b = hexLookup.dec![hex[i * 2] + hex[i * 2 + 1]];

        if (b === undefined) {
            throw new Error('Expected hex string');
        }

        result[i] = b;
    }

    return result;
}

/** Generate N random bytes, throws if a secure random source isn't available. */
export function secureRandom(length: number): Uint8Array {
    return rand(length);
}

/** Used in isInstanceOf checks so we don't spam with warnings. */
let didWarn = false;

/** Check if object in instance of class. */
export function isInstanceOf<T extends { new(...args: any[]): InstanceType<T> }>(
    object: any,
    someClass: T
): object is InstanceType<T> {
    if (object instanceof someClass) {
        return true;
    }

    if (object == null || typeof object !== 'object') {
        return false;
    }

    // not an actual instance but since bundlers can fail to dedupe stuff or
    // multiple versions can be included we check for compatibility if possible
    const className = someClass['__className'] || someClass['abiName'];

    if (!className) {
        return false;
    }

    let instanceClass = object.constructor;
    let isAlienInstance = false;

    while (instanceClass && !isAlienInstance) {
        const instanceClassName = instanceClass['__className'] || instanceClass['abiName'];

        if (!instanceClassName) {
            break;
        }

        isAlienInstance = className == instanceClassName;
        instanceClass = Object.getPrototypeOf(instanceClass);
    }

    if (isAlienInstance && !didWarn) {
        // eslint-disable-next-line no-console
        console.warn(
            `Detected alien instance of ${className}, this usually means more than one version of @wireio/core has been included in your bundle.`
        );
        didWarn = true;
    }

    return isAlienInstance;
}

/**
 * Convert an Ethereum signature to WIRE format, either K1 or EM based on prefix.
 *
 * @param eth_sig A signature in the format of an Ethereum signature.
 * @param prefix WIRE prefix to use for the signature. K1 or EM, EM by default.
 * @returns A WIRE formatted signature.
 */
export function evmSigToWire(eth_sig: string, prefix = 'EM') {
    // --- same r/s/v extraction as before ---
    if ((!eth_sig.startsWith('0x') && eth_sig.length !== 130) ||
        (eth_sig.startsWith('0x') && eth_sig.length !== 132))
        throw new Error('Incorrect length or signature type');

    const raw = eth_sig.startsWith('0x') ? eth_sig.slice(2) : eth_sig;
    const r = raw.slice(0, 64);
    const s = raw.slice(64, 128);
    let v = raw.slice(128);
    v = (parseInt(v, 16) + 4).toString(16).padStart(2, '0');

    const sigBefore = v + r + s; // hex string, no checksum yet

    // ——> this one line replaces your manual digest+slice+hex + ethers.utils.base58.encode:
    const payload = Base58.encodeRipemd160Check(
        Buffer.from(sigBefore, 'hex'),
        prefix
    );

    return `SIG_${prefix}_${payload}`;
}


/**
 * Get the public key in compressed format from a public or private key.
 *
 * @param key Either a public or private key
 * @param isPrivate Boolean indicating if the key is private, defaults to false.
 * @returns The public key in compressed format.
 */
export const getCompressedPublicKey = (key: string, isPrivate = false): string => {
    const ec = getCurve(KeyType.K1)
    if (key.startsWith('0x')) key = key.slice(2);
    const keyPair = isPrivate
        ? ec.keyFromPrivate(key)
        : ec.keyFromPublic(key, 'hex');
    return keyPair.getPublic(true, 'hex');
};

/**
 * Signs a given hash with the provided private key directly.
 * This function removes any '0x' prefix from the private key and hash,
 * signs the hash, and formats the signature in the Ethereum signature format.
 * Additionally, it computes the Ethereum address corresponding to the private key.
 *
 * @param {string} privateKey - The private key in hex format.
 * @param {string} hash - The hash to be signed.
 * @returns {SignHash} An object containing the Ethereum signature and address.
 */
export const directSignHash = (privateKey: string, hash: string): SignHash => {
    const ec = getCurve(KeyType.EM)
    if (privateKey.startsWith('0x')) privateKey = privateKey.slice(2);
    if (hash.startsWith('0x')) hash = hash.slice(2);
    const keyPair = ec.keyFromPrivate(privateKey);
    const sig = keyPair.sign(hash, 'hex');

    // Extract Ethereum address from the keyPair
    const publicKey = keyPair.getPublic('hex').slice(2); // Remove the '04' prefix (uncompressed format)
    const pubKeyHash = ethers.utils.keccak256(Buffer.from(publicKey, 'hex'));
    const address = '0x' + pubKeyHash.slice(-40); // Last 20 bytes as Ethereum address

    // Convert r, s, and recovery param into the Ethereum Signature format
    const r = sig.r.toString(16).padStart(64, '0');
    const s = sig.s.toString(16).padStart(64, '0');
    const v = (sig.recoveryParam || 0) + 27; // 27 or 28

    return { signature: '0x' + r + s + v.toString(16), address };
};

export interface SignHash {
    signature: string; // Ethereum signature format
    address: string; // Ethereum address derived from the private key
}

// --- hex ↔ bytes helper ---
// export function hexToBytes(hex: string): Uint8Array {
//     hex = hex.replace(/^0x/, "");
//     if (hex.length & 1) hex = "0" + hex;
//     const out = new Uint8Array(hex.length / 2);

//     for (let i = 0; i < out.length; i++) {
//         out[i] = parseInt(hex.substr(2 * i, 2), 16);
//     }
    
//     return out;
// }