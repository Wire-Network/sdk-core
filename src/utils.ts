import {ABISerializableObject} from './serializer/serializable'
import rand from 'brorand'

export function arrayEquals(a: ArrayLike<number>, b: ArrayLike<number>) {
    const len = a.length
    if (len !== b.length) {
        return false
    }
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return false
        }
    }
    return true
}

export function arrayEquatableEquals(a: ABISerializableObject[], b: ABISerializableObject[]) {
    const len = a.length
    if (len !== b.length) {
        return false
    }
    for (let i = 0; i < len; i++) {
        if (!a[i].equals(b[i])) {
            return false
        }
    }
    return true
}

const hexLookup: {enc?: Array<string>; dec?: Record<string, number>} = {}
function buildHexLookup() {
    hexLookup.enc = new Array<string>(0xff)
    hexLookup.dec = {}
    for (let i = 0; i <= 0xff; ++i) {
        const b = i.toString(16).padStart(2, '0')
        hexLookup.enc[i] = b
        hexLookup.dec[b] = i
    }
}

export function arrayToHex(array: ArrayLike<number>) {
    if (!hexLookup.enc) {
        buildHexLookup()
    }
    const len = array.length
    const rv = new Array<string>(len)
    for (let i = 0; i < len; ++i) {
        rv[i] = hexLookup.enc![array[i]]
    }
    return rv.join('')
}

export function hexToArray(hex: string) {
    if (!hexLookup.dec) {
        buildHexLookup()
    }
    if (typeof hex !== 'string') {
        throw new Error('Expected string containing hex digits')
    }
    if (hex.length % 2) {
        throw new Error('Odd number of hex digits')
    }
    hex = hex.toLowerCase()
    const len = hex.length / 2
    const result = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        const b = hexLookup.dec![hex[i * 2] + hex[i * 2 + 1]]
        if (b === undefined) {
            throw new Error('Expected hex string')
        }
        result[i] = b
    }
    return result
}

/** Generate N random bytes, throws if a secure random source isn't available. */
export function secureRandom(length: number): Uint8Array {
    return rand(length)
}

/** Used in isInstanceOf checks so we don't spam with warnings. */
let didWarn = false

/** Check if object in instance of class. */
export function isInstanceOf<T extends {new (...args: any[]): InstanceType<T>}>(
    object: any,
    someClass: T
): object is InstanceType<T> {
    if (object instanceof someClass) {
        return true
    }
    if (object == null || typeof object !== 'object') {
        return false
    }
    // not an actual instance but since bundlers can fail to dedupe stuff or
    // multiple versions can be included we check for compatibility if possible
    const className = someClass['__className'] || someClass['abiName']
    if (!className) {
        return false
    }
    let instanceClass = object.constructor
    let isAlienInstance = false
    while (instanceClass && !isAlienInstance) {
        const instanceClassName = instanceClass['__className'] || instanceClass['abiName']
        if (!instanceClassName) {
            break
        }
        isAlienInstance = className == instanceClassName
        instanceClass = Object.getPrototypeOf(instanceClass)
    }
    if (isAlienInstance && !didWarn) {
        // eslint-disable-next-line no-console
        console.warn(
            `Detected alien instance of ${className}, this usually means more than one version of @wharfkit/antelope has been included in your bundle.`
        )
        didWarn = true
    }
    return isAlienInstance
}

/**
 * Given a hex string of an address, returns a valid wire name. Takes the first and last 4 bytes ( 8 characters from each end ) and converts them to a base32 string.
 *
 * Note: This implementation has a nearly impossible chance of collisions. Reference: https://vanity-eth.tk/
 *
 * @param address Hex formatted string of an address. '0x' prefix is optional, will be pruned.
 * @returns A valid Wire name generated from the address.
 */
export function addressToWireName(address: string) {
    if (![40, 42].includes(address.length)) throw new Error('not valid address length')
    let addr = address.includes('0x') ? address.slice(2) : address
    if (addr[40] !== '0') addr = addr.slice(0, -1) + '0'
    const int = BigInt('0x' + addr.slice(0, 8) + addr.slice(-8))
    const charMap = '.12345abcdefghijklmnopqrstuvwxyz'
    const str: any[] = []
    let tmp = BigInt.asUintN(64, int)
    for (let i = 0; i <= 12; ++i) {
        const bigiAnd = BigInt(i === 0 ? 0x0f : 0x1f)
        const idx = tmp & bigiAnd
        str[12 - i] = charMap[Number(idx.toString())]
        const bigi = BigInt(i === 0 ? 4 : 5)
        tmp = tmp >> bigi
    }
    return str.join('').replace(/\.+$/g, '')
}
