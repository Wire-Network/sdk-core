import { ABISerializableObject } from './serializer/serializable';
import rand from 'brorand';
import { Base58 } from './base58';
import { getCurve } from './crypto/curves';

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

const ec = getCurve('K1')

/**
 * Get the public key in compressed format from a public or private key.
 *
 * @param key Either a public or private key
 * @param isPrivate Boolean indicating if the key is private, defaults to false.
 * @returns The public key in compressed format.
 */

export const getCompressedPublicKey = (
    key: string,
    isPrivate = false
): string => {
    if (key.startsWith('0x')) key = key.slice(2);
    const keyPair = isPrivate
        ? ec.keyFromPrivate(key)
        : ec.keyFromPublic(key, 'hex');
    return keyPair.getPublic(true, 'hex');
};