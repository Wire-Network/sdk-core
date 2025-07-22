import { ABISerializableObject } from './serializer/serializable';
import rand from 'brorand';
import { Base58 } from './base58';
import { getCurve } from './crypto/curves';
import { KeyType, Name, NameType, TimePoint } from './chain';
import { ethers } from 'ethers';
import { Serializer } from './serializer';

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
 * @deprecated This function will be removed in a future version. Use Signature.fromHex() instead.
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
export const getCompressedPublicKey = (key: string, type: KeyType = KeyType.K1, isPrivate = false): string => {
    const ec = getCurve(type)
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

// convert all Buffer/JSON->Uint8Array in txExtra
export const normalizeBytesField = (x: any): Uint8Array => {
    // already a byte array
    if (x instanceof Uint8Array) return x;

    // Node.js Buffer
    if (Buffer.isBuffer(x)) return Uint8Array.from(x);

    // plain number[]
    if (Array.isArray(x) && x.every(n => typeof n === 'number'))
        return Uint8Array.from(x);

    // JSON-serialized Buffer { type:"Buffer", data:[…] }
    if (x && typeof x === 'object' && Array.isArray((x as any).data))
        return Uint8Array.from((x as any).data);

    // array-like object keyed by "0","1",… 
    if (x && typeof x === 'object' && !Array.isArray(x)) {
        const idx = Object.keys(x)
            .filter(k => /^\d+$/.test(k))
            .map(k => parseInt(k)).sort((a, b) => a - b);

        if (idx.length) {
            return Uint8Array.from(idx.map(i => (x as any)[i]));
        }
    }

    // hex string
    if (typeof x === 'string')
        return ethers.utils.arrayify(x);

    return x
}

/**
 * Converts Buffer containing an Ethereum address (link that stored in auth.msg links table)
 * Adds Ox and resturns as readable hex string
 * 20 bytes expected
 *
 * @param address 20 bytes buffer of eth address
 * @returns readable hex string of eth address with 0x prefix
 */
export const ethAddressBufferToString = (address: Buffer) =>
    '0x' + Buffer.from(address).toString('hex');


/**
 * Ensures a hex string starts with '0x'.
 * If it does not, prepends '0x' to the string.
 * @param hex - The hex string to check
 * @returns The hex string with '0x' prefix if it was not present
 */
export const ensure0x = (hex: string): string => {
    return hex.startsWith('0x') ? hex : `0x${hex}`;
};

/**
 * Converts a TimePoint date to a block timestamp.
 * 
 * @param date - The TimePoint date to convert
 * @returns The block timestamp as a number
 */
export const dateToBlockTimestamp = (date: TimePoint): number => {
    return Math.round((checkDateParse(date.toString() + 'Z') - 946684800000) / 500);
};

/**
 * Parses a TimePointSecString date and returns its numeric representation.
 * 
 * @param date - The date string in TimePointSecString format to parse
 * @returns The numeric timestamp representation of the date in milliseconds
 * @throws Error if the date string cannot be parsed into a valid date
 */
export const checkDateParse = (date: TimePointSecString): number => {
    const result = Date.parse(date);

    if (Number.isNaN(result)) {
        throw new Error('Invalid time format');
    }

    return result;
};

/**
 * Converts a WIRE name (NameType) to a 64-bit unsigned integer.
 * 
 * @param username - The WIRE name to convert
 * @returns A 64-bit unsigned integer representation of the name
 */
export const nameToUInt64 = (username: NameType): number => {
    const name = Name.from(username);
    const nameInt = +String(name.value);
    return nameInt;
};

/**
 * Serialize an WIRE name into its 8-byte little-endian hex and prefix with 0x.
 *
 * @param input  The name to serialize, either as a string or a Name instance
 * @returns      A hex string like "0x000000005c73285d"
 */
export const serializeName = (input: string | Name): string => {
    // Ensure we have a Name instance
    const nameObj = typeof input === 'string'
        ? Name.from(input)
        : input;

    const { hexString } = Serializer.encode({ object: nameObj });
    return `0x${hexString}`;
};

export type TimePointSecString = string; // ISO date string

/**
 * Converts any 0x hex string to a checksum hash string that can be used as the sha256 index for a contract table.
 *
 * @param hex Any 0x hex string, typically an Ethereum address or signature
 * @returns Sha256 checksum of the hex
 */
export const checksum_hash = (hex: string) => {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    const buffer = Buffer.from(hex, 'hex');
    return ethers.utils.sha256(buffer);
};

/**
 * Returns true iff `bytes` is valid UTF-8.
 * @param {Uint8Array|ArrayBuffer|Buffer} bytes
 */
export const isUtf8 = (bytes) => {
    // Ensure we have a Uint8Array
    if (bytes instanceof ArrayBuffer) {
        bytes = new Uint8Array(bytes);
    } else if (Buffer.isBuffer(bytes)) {
        bytes = new Uint8Array(bytes);
    }

    try {
        // The `{ fatal: true }` option makes decode() throw on invalid sequences
        const decoder = new TextDecoder('utf-8', { fatal: true });
        decoder.decode(bytes);
        return true;
    } catch (e) {
        return false;
    }
}