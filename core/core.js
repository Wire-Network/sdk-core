/**
 * @wharfkit/antelope v1.1.0
 * https://gitea.gitgo.app/Wire/sdk-core
 *
 * @license
 * Copyright (c) 2023 FFF00 Agents AB & Greymass Inc. All Rights Reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1.  Redistribution of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 * 
 * 2.  Redistribution in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 * 
 * 3.  Neither the name of the copyright holder nor the names of its contributors
 *     may be used to endorse or promote products derived from this software without
 *     specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * YOU ACKNOWLEDGE THAT THIS SOFTWARE IS NOT DESIGNED, LICENSED OR INTENDED FOR USE
 * IN THE DESIGN, CONSTRUCTION, OPERATION OR MAINTENANCE OF ANY MILITARY FACILITY.
 */
'use strict';

var rand = require('brorand');
var hash_js = require('hash.js');
var BN = require('bn.js');
var elliptic = require('elliptic');
var tslib = require('tslib');
var pako = require('pako');

function arrayEquals(a, b) {
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
function arrayEquatableEquals(a, b) {
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
const hexLookup = {};
function buildHexLookup() {
    hexLookup.enc = new Array(0xff);
    hexLookup.dec = {};
    for (let i = 0; i <= 0xff; ++i) {
        const b = i.toString(16).padStart(2, '0');
        hexLookup.enc[i] = b;
        hexLookup.dec[b] = i;
    }
}
function arrayToHex(array) {
    if (!hexLookup.enc) {
        buildHexLookup();
    }
    const len = array.length;
    const rv = new Array(len);
    for (let i = 0; i < len; ++i) {
        rv[i] = hexLookup.enc[array[i]];
    }
    return rv.join('');
}
function hexToArray(hex) {
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
        const b = hexLookup.dec[hex[i * 2] + hex[i * 2 + 1]];
        if (b === undefined) {
            throw new Error('Expected hex string');
        }
        result[i] = b;
    }
    return result;
}
/** Generate N random bytes, throws if a secure random source isn't available. */
function secureRandom(length) {
    return rand(length);
}
/** Used in isInstanceOf checks so we don't spam with warnings. */
let didWarn = false;
/** Check if object in instance of class. */
function isInstanceOf(object, someClass) {
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
        console.warn(`Detected alien instance of ${className}, this usually means more than one version of @wharfkit/antelope has been included in your bundle.`);
        didWarn = true;
    }
    return isAlienInstance;
}
/**
 * Given a hex string of an address, returns a valid wire name. Takes the first and last 4 bytes ( 8 characters from each end ) and converts them to a base32 string.
 *
 * Note: This implementation has a nearly impossible chance of collisions. Reference: https://vanity-eth.tk/
 *
 * @param address Hex formatted string of an address. '0x' prefix is optional, will be pruned.
 * @returns A valid Wire name generated from the address.
 */
function addressToWireName(address) {
    if (![40, 42].includes(address.length))
        throw new Error('not valid address length');
    let addr = address.includes('0x') ? address.slice(2) : address;
    if (addr[40] !== '0')
        addr = addr.slice(0, -1) + '0';
    const int = BigInt('0x' + addr.slice(0, 8) + addr.slice(-8));
    const charMap = '.12345abcdefghijklmnopqrstuvwxyz';
    const str = [];
    let tmp = BigInt.asUintN(64, int);
    for (let i = 0; i <= 12; ++i) {
        const bigiAnd = BigInt(i === 0 ? 0x0f : 0x1f);
        const idx = tmp & bigiAnd;
        str[12 - i] = charMap[Number(idx.toString())];
        const bigi = BigInt(i === 0 ? 4 : 5);
        tmp = tmp >> bigi;
    }
    return str.join('').replace(/\.+$/g, '');
}

class Blob {
    /**
     * Create a new Blob instance.
     */
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (typeof value === 'string') {
            return this.fromString(value);
        }
        throw new Error('Invalid blob');
    }
    static fromString(value) {
        // If buffer is available, use it (maintains support for nodejs 14)
        if (typeof Buffer === 'function') {
            return new this(new Uint8Array(Buffer.from(value, 'base64')));
        }
        // fix up base64 padding from nodeos
        switch (value.length % 4) {
            case 2:
                value += '==';
                break;
            case 3:
                value += '=';
                break;
            case 1:
                value = value.substring(0, value.length - 1);
                break;
        }
        const string = atob(value);
        const array = new Uint8Array(string.length);
        for (let i = 0; i < string.length; i++) {
            array[i] = string.charCodeAt(i);
        }
        return new this(array);
    }
    constructor(array) {
        this.array = array;
    }
    equals(other) {
        const self = this.constructor;
        try {
            return arrayEquals(this.array, self.from(other).array);
        }
        catch (_a) {
            return false;
        }
    }
    get base64String() {
        // If buffer is available, use it (maintains support for nodejs 14)
        if (typeof Buffer === 'function') {
            return Buffer.from(this.array).toString('base64');
        }
        return btoa(this.utf8String);
    }
    /** UTF-8 string representation of this instance. */
    get utf8String() {
        return new TextDecoder().decode(this.array);
    }
    toABI(encoder) {
        encoder.writeArray(this.array);
    }
    toString() {
        return this.base64String;
    }
    toJSON() {
        return this.toString();
    }
}
Blob.abiName = 'blob';

class Bytes {
    /**
     * Create a new Bytes instance.
     * @note Make sure to take a [[copy]] before mutating the bytes as the underlying source is not copied here.
     */
    static from(value, encoding) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (typeof value === 'string') {
            return this.fromString(value, encoding);
        }
        if (ArrayBuffer.isView(value)) {
            return new this(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        }
        if (isInstanceOf(value['array'], Uint8Array)) {
            return new this(value['array']);
        }
        return new this(new Uint8Array(value));
    }
    static fromString(value, encoding = 'hex') {
        if (encoding === 'hex') {
            const array = hexToArray(value);
            return new this(array);
        }
        else if (encoding == 'utf8') {
            const encoder = new TextEncoder();
            return new this(encoder.encode(value));
        }
        else {
            throw new Error(`Unknown encoding: ${encoding}`);
        }
    }
    static fromABI(decoder) {
        const len = decoder.readVaruint32();
        return new this(decoder.readArray(len));
    }
    static abiDefault() {
        return new Bytes();
    }
    static equal(a, b) {
        return this.from(a).equals(this.from(b));
    }
    static random(length) {
        return new this(secureRandom(length));
    }
    /** Return true if given value is a valid `BytesType`. */
    static isBytes(value) {
        if (isInstanceOf(value, Bytes) || isInstanceOf(value, Uint8Array)) {
            return true;
        }
        if (Array.isArray(value) && value.every((v) => typeof v === 'number')) {
            return true;
        }
        if (typeof value === 'string' && (/[\da-f]/i.test(value) || value === '')) {
            return true;
        }
        return false;
    }
    constructor(array = new Uint8Array()) {
        this.array = array;
    }
    /** Number of bytes in this instance. */
    get length() {
        return this.array.byteLength;
    }
    /** Hex string representation of this instance. */
    get hexString() {
        return arrayToHex(this.array);
    }
    /** UTF-8 string representation of this instance. */
    get utf8String() {
        return new TextDecoder().decode(this.array);
    }
    /** Mutating. Append bytes to this instance. */
    append(other) {
        other = Bytes.from(other);
        const newSize = this.array.byteLength + other.array.byteLength;
        const buffer = new ArrayBuffer(newSize);
        const array = new Uint8Array(buffer);
        array.set(this.array);
        array.set(other.array, this.array.byteLength);
        this.array = array;
    }
    /** Non-mutating, returns a copy of this instance with appended bytes. */
    appending(other) {
        const rv = new Bytes(this.array);
        rv.append(other);
        return rv;
    }
    /** Mutating. Pad this instance to length. */
    zeropad(n, truncate = false) {
        const newSize = truncate ? n : Math.max(n, this.array.byteLength);
        const buffer = new ArrayBuffer(newSize);
        const array = new Uint8Array(buffer);
        array.fill(0);
        if (truncate && this.array.byteLength > newSize) {
            array.set(this.array.slice(0, newSize), 0);
        }
        else {
            array.set(this.array, newSize - this.array.byteLength);
        }
        this.array = array;
    }
    /** Non-mutating, returns a copy of this instance with zeros padded. */
    zeropadded(n, truncate = false) {
        const rv = new Bytes(this.array);
        rv.zeropad(n, truncate);
        return rv;
    }
    /** Mutating. Drop bytes from the start of this instance. */
    dropFirst(n = 1) {
        this.array = this.array.subarray(n);
    }
    /** Non-mutating, returns a copy of this instance with dropped bytes from the start. */
    droppingFirst(n = 1) {
        return new Bytes(this.array.subarray(n));
    }
    copy() {
        const buffer = new ArrayBuffer(this.array.byteLength);
        const array = new Uint8Array(buffer);
        array.set(this.array);
        return new Bytes(array);
    }
    equals(other) {
        return arrayEquals(this.array, Bytes.from(other).array);
    }
    toString(encoding = 'hex') {
        if (encoding === 'hex') {
            return this.hexString;
        }
        else if (encoding === 'utf8') {
            return this.utf8String;
        }
        else {
            throw new Error(`Unknown encoding: ${encoding}`);
        }
    }
    toABI(encoder) {
        encoder.writeVaruint32(this.array.byteLength);
        encoder.writeArray(this.array);
    }
    toJSON() {
        return this.hexString;
    }
}
Bytes.abiName = 'bytes';

class Checksum {
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (isInstanceOf(value, Checksum)) {
            return new this(value.array);
        }
        return new this(Bytes.from(value).array);
    }
    static fromABI(decoder) {
        return new this(decoder.readArray(this.byteSize));
    }
    static abiDefault() {
        return new this(new Uint8Array(this.byteSize));
    }
    constructor(array) {
        const byteSize = this.constructor.byteSize;
        if (array.byteLength !== byteSize) {
            throw new Error(`Checksum size mismatch, expected ${byteSize} bytes got ${array.byteLength}`);
        }
        this.array = array;
    }
    equals(other) {
        const self = this.constructor;
        try {
            return arrayEquals(this.array, self.from(other).array);
        }
        catch (_a) {
            return false;
        }
    }
    get hexString() {
        return arrayToHex(this.array);
    }
    toABI(encoder) {
        encoder.writeArray(this.array);
    }
    toString() {
        return this.hexString;
    }
    toJSON() {
        return this.toString();
    }
}
Checksum.abiName = '__checksum';
class Checksum256 extends Checksum {
    static from(value) {
        return super.from(value);
    }
    static hash(data) {
        const digest = new Uint8Array(hash_js.sha256().update(Bytes.from(data).array).digest());
        return new Checksum256(digest);
    }
}
Checksum256.abiName = 'checksum256';
Checksum256.byteSize = 32;
class Checksum512 extends Checksum {
    static from(value) {
        return super.from(value);
    }
    static hash(data) {
        const digest = new Uint8Array(hash_js.sha512().update(Bytes.from(data).array).digest());
        return new Checksum512(digest);
    }
}
Checksum512.abiName = 'checksum512';
Checksum512.byteSize = 64;
class Checksum160 extends Checksum {
    static from(value) {
        return super.from(value);
    }
    static hash(data) {
        const digest = new Uint8Array(hash_js.ripemd160().update(Bytes.from(data).array).digest());
        return new Checksum160(digest);
    }
}
Checksum160.abiName = 'checksum160';
Checksum160.byteSize = 20;

/** Supported Wire curve types. */
exports.KeyType = void 0;
(function (KeyType) {
    KeyType["K1"] = "K1";
    KeyType["R1"] = "R1";
    KeyType["WA"] = "WA";
    KeyType["EM"] = "EM";
})(exports.KeyType || (exports.KeyType = {}));
(function (KeyType) {
    function indexFor(value) {
        switch (value) {
            case KeyType.K1:
                return 0;
            case KeyType.R1:
                return 1;
            case KeyType.WA:
                return 2;
            case KeyType.EM:
                return 3;
            default:
                throw new Error(`Unknown curve type: ${value}`);
        }
    }
    KeyType.indexFor = indexFor;
    function from(value) {
        let index;
        if (typeof value !== 'number') {
            index = KeyType.indexFor(value);
        }
        else {
            index = value;
        }
        switch (index) {
            case 0:
                return KeyType.K1;
            case 1:
                return KeyType.R1;
            case 2:
                return KeyType.WA;
            case 3:
                return KeyType.EM;
            default:
                throw new Error('Unknown curve type');
        }
    }
    KeyType.from = from;
})(exports.KeyType || (exports.KeyType = {}));

/**
 * Binary integer with the underlying value represented by a BN.js instance.
 * Follows C++11 standard for arithmetic operators and conversions.
 * @note This type is optimized for correctness not speed, if you plan to manipulate
 *       integers in a tight loop you're advised to use the underlying BN.js value or
 *       convert to a JavaScript number first.
 */
class Int {
    /** Largest value that can be represented by this integer type. */
    static get max() {
        return new BN(2).pow(new BN(this.byteWidth * 8 - (this.isSigned ? 1 : 0))).isubn(1);
    }
    /** Smallest value that can be represented by this integer type. */
    static get min() {
        return this.isSigned ? this.max.ineg().isubn(1) : new BN(0);
    }
    /** Add `lhs` to `rhs` and return the resulting value. */
    static add(lhs, rhs, overflow = 'truncate') {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.add(b));
    }
    /** Add `lhs` to `rhs` and return the resulting value. */
    static sub(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.sub(b));
    }
    /** Multiply `lhs` by `rhs` and return the resulting value. */
    static mul(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.mul(b));
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient, dropping the remainder.
     * @throws When dividing by zero.
     */
    static div(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            return a.div(b);
        });
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded to the closest integer.
     * @throws When dividing by zero.
     */
    static divRound(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            return a.divRound(b);
        });
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded up to the closest integer.
     * @throws When dividing by zero.
     */
    static divCeil(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            const dm = a.divmod(b);
            if (dm.mod.isZero())
                return dm.div;
            return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        });
    }
    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than `rhs`. */
    static gt(lhs, rhs) {
        return lhs.value.gt(rhs.value);
    }
    /** Compare `lhs` to `rhs` and return true if `lhs` is less than `rhs`. */
    static lt(lhs, rhs) {
        return lhs.value.lt(rhs.value);
    }
    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than or equal to `rhs`. */
    static gte(lhs, rhs) {
        return lhs.value.gte(rhs.value);
    }
    /** Compare `lhs` to `rhs` and return true if `lhs` is less than or equal to `rhs`. */
    static lte(lhs, rhs) {
        return lhs.value.lte(rhs.value);
    }
    /**
     * Can be used to implement custom operator.
     * @internal
     */
    static operator(lhs, rhs, overflow = 'truncate', fn) {
        const { a, b } = convert(lhs, rhs);
        const type = a.constructor;
        const result = fn(a.value, b.value);
        return type.from(result, overflow);
    }
    static from(value, overflow) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        let fromType = this;
        let bn;
        if (isInstanceOf(value, Int)) {
            fromType = value.constructor;
            bn = value.value.clone();
        }
        else if (value instanceof Uint8Array) {
            bn = new BN(value, undefined, 'le');
            if (fromType.isSigned) {
                bn = bn.fromTwos(fromType.byteWidth * 8);
            }
        }
        else {
            if ((typeof value === 'string' && !/[0-9]+/.test(value)) ||
                (typeof value === 'number' && !Number.isFinite(value))) {
                throw new Error('Invalid number');
            }
            bn = BN.isBN(value) ? value.clone() : new BN(value, 10);
            if (bn.isNeg() && !fromType.isSigned) {
                fromType = { byteWidth: fromType.byteWidth, isSigned: true };
            }
        }
        switch (overflow) {
            case 'clamp':
                bn = clamp(bn, this.min, this.max);
                break;
            case 'truncate':
                bn = truncate(bn, fromType, this);
                break;
        }
        return new this(bn);
    }
    static fromABI(decoder) {
        return this.from(decoder.readArray(this.byteWidth));
    }
    static abiDefault() {
        return this.from(0);
    }
    static random() {
        return this.from(secureRandom(this.byteWidth));
    }
    /**
     * Create a new instance, don't use this directly. Use the `.from` factory method instead.
     * @throws If the value over- or under-flows the integer type.
     */
    constructor(value) {
        const self = this.constructor;
        if (self.isSigned === undefined || self.byteWidth === undefined) {
            throw new Error('Cannot instantiate abstract class Int');
        }
        if (value.gt(self.max)) {
            throw new Error(`Number ${value} overflows ${self.abiName}`);
        }
        if (value.lt(self.min)) {
            throw new Error(`Number ${value} underflows ${self.abiName}`);
        }
        this.value = value;
    }
    cast(type, overflow = 'truncate') {
        if (this.constructor === type) {
            return this;
        }
        return type.from(this, overflow);
    }
    /** Number as bytes in little endian (matches memory layout in C++ contract). */
    get byteArray() {
        const self = this.constructor;
        const value = self.isSigned ? this.value.toTwos(self.byteWidth * 8) : this.value;
        return value.toArrayLike(Uint8Array, 'le', self.byteWidth);
    }
    /**
     * Compare two integers, if strict is set to true the test will only consider integers
     * of the exact same type. I.e. Int64.from(1).equals(UInt64.from(1)) will return false.
     */
    equals(other, strict = false) {
        const self = this.constructor;
        if (strict === true && isInstanceOf(other, Int)) {
            const otherType = other.constructor;
            if (self.byteWidth !== otherType.byteWidth || self.isSigned !== otherType.isSigned) {
                return false;
            }
        }
        try {
            return this.value.eq(self.from(other).value);
        }
        catch (_a) {
            return false;
        }
    }
    /** Mutating add. */
    add(num) {
        this.value = this.operator(num, Int.add).value;
    }
    /** Non-mutating add. */
    adding(num) {
        return this.operator(num, Int.add);
    }
    /** Mutating subtract. */
    subtract(num) {
        this.value = this.operator(num, Int.sub).value;
    }
    /** Non-mutating subtract. */
    subtracting(num) {
        return this.operator(num, Int.sub);
    }
    /** Mutating multiply. */
    multiply(by) {
        this.value = this.operator(by, Int.mul).value;
    }
    /** Non-mutating multiply. */
    multiplying(by) {
        return this.operator(by, Int.mul);
    }
    /**
     * Mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    divide(by, behavior) {
        this.value = this.dividing(by, behavior).value;
    }
    /**
     * Non-mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    dividing(by, behavior) {
        let op = Int.div;
        switch (behavior) {
            case 'ceil':
                op = Int.divCeil;
                break;
            case 'round':
                op = Int.divRound;
                break;
        }
        return this.operator(by, op);
    }
    /** Greater than comparision operator */
    gt(other) {
        return Int.gt(this, other);
    }
    /** Less than comparision operator */
    lt(other) {
        return Int.lt(this, other);
    }
    /** Greater than or equal comparision operator */
    gte(other) {
        return Int.gte(this, other);
    }
    /** Less than or equal comparision operator */
    lte(other) {
        return Int.lte(this, other);
    }
    /**
     * Run operator with C++11 implicit conversion.
     * @internal
     */
    operator(other, fn) {
        let rhs;
        if (isInstanceOf(other, Int)) {
            rhs = other;
        }
        else {
            rhs = Int64.from(other, 'truncate');
        }
        return fn(this, rhs).cast(this.constructor);
    }
    /**
     * Convert to a JavaScript number.
     * @throws If the number cannot be represented by 53-bits.
     **/
    toNumber() {
        return this.value.toNumber();
    }
    toString() {
        return this.value.toString();
    }
    [Symbol.toPrimitive](type) {
        if (type === 'number') {
            return this.toNumber();
        }
        else {
            return this.toString();
        }
    }
    toABI(encoder) {
        encoder.writeArray(this.byteArray);
    }
    toJSON() {
        // match FCs behavior and return strings for anything above 32-bit
        if (this.value.bitLength() > 32) {
            return this.value.toString();
        }
        else {
            return this.value.toNumber();
        }
    }
}
Int.abiName = '__int';
class Int8 extends Int {
}
Int8.abiName = 'int8';
Int8.byteWidth = 1;
Int8.isSigned = true;
class Int16 extends Int {
}
Int16.abiName = 'int16';
Int16.byteWidth = 2;
Int16.isSigned = true;
class Int32 extends Int {
}
Int32.abiName = 'int32';
Int32.byteWidth = 4;
Int32.isSigned = true;
class Int64 extends Int {
}
Int64.abiName = 'int64';
Int64.byteWidth = 8;
Int64.isSigned = true;
class Int128 extends Int {
}
Int128.abiName = 'int128';
Int128.byteWidth = 16;
Int128.isSigned = true;
class UInt8 extends Int {
}
UInt8.abiName = 'uint8';
UInt8.byteWidth = 1;
UInt8.isSigned = false;
class UInt16 extends Int {
}
UInt16.abiName = 'uint16';
UInt16.byteWidth = 2;
UInt16.isSigned = false;
class UInt32 extends Int {
}
UInt32.abiName = 'uint32';
UInt32.byteWidth = 4;
UInt32.isSigned = false;
class UInt64 extends Int {
}
UInt64.abiName = 'uint64';
UInt64.byteWidth = 8;
UInt64.isSigned = false;
class UInt128 extends Int {
}
UInt128.abiName = 'uint128';
UInt128.byteWidth = 16;
UInt128.isSigned = false;
class VarInt extends Int {
    static fromABI(decoder) {
        return new this(new BN(decoder.readVarint32()));
    }
    toABI(encoder) {
        encoder.writeVarint32(Number(this));
    }
}
VarInt.abiName = 'varint32';
VarInt.byteWidth = 32;
VarInt.isSigned = true;
class VarUInt extends Int {
    static fromABI(decoder) {
        return new this(new BN(decoder.readVaruint32()));
    }
    toABI(encoder) {
        encoder.writeVaruint32(Number(this));
    }
}
VarUInt.abiName = 'varuint32';
VarUInt.byteWidth = 32;
VarUInt.isSigned = false;
/** Clamp number between min and max. */
function clamp(num, min, max) {
    return BN.min(BN.max(num, min), max);
}
/**
 * Create new BN with the same bit pattern as the passed value,
 * extending or truncating the value’s representation as necessary.
 */
function truncate(value, from, to) {
    const fill = value.isNeg() ? 255 : 0;
    const fromValue = from.isSigned ? value.toTwos(from.byteWidth * 8) : value;
    const fromBytes = fromValue.toArrayLike(Uint8Array, 'le');
    const toBytes = new Uint8Array(to.byteWidth);
    toBytes.fill(fill);
    toBytes.set(fromBytes.slice(0, to.byteWidth));
    const toValue = new BN(toBytes, undefined, 'le');
    return to.isSigned ? toValue.fromTwos(to.byteWidth * 8) : toValue;
}
/** C++11 implicit integer conversions. */
function convert(a, b) {
    // The integral promotions (4.5) shall be performed on both operands.
    a = promote(a);
    b = promote(b);
    const aType = a.constructor;
    const bType = b.constructor;
    // If both operands have the same type, no further conversion is needed
    if (aType !== bType) {
        // Otherwise, if both operands have signed integer types or both have unsigned integer types,
        // the operand with the type of lesser integer conversion rank shall be converted to the type
        // of the operand with greater rank.
        if (aType.isSigned === bType.isSigned) {
            if (aType.byteWidth > bType.byteWidth) {
                b = b.cast(aType);
            }
            else if (bType.byteWidth > aType.byteWidth) {
                a = a.cast(bType);
            }
        }
        else {
            // Otherwise, if the operand that has unsigned integer type has rank greater than or equal
            // to the rank of the type of the other operand, the operand with signed integer type
            // shall be converted to the type of the operand with unsigned integer type.
            if (aType.isSigned === false && aType.byteWidth >= bType.byteWidth) {
                b = b.cast(aType);
            }
            else if (bType.isSigned === false && bType.byteWidth >= aType.byteWidth) {
                a = a.cast(bType);
            }
            else {
                // Otherwise, if the type of the operand with signed integer type can represent all of the
                // values of the type of the operand with unsigned integer type, the operand with unsigned
                // integer type shall be converted to the type of the operand with signed integer type.
                if (aType.isSigned === true &&
                    aType.max.gte(bType.max) &&
                    aType.min.lte(bType.min)) {
                    b = b.cast(aType);
                }
                else if (bType.isSigned === true &&
                    bType.max.gte(aType.max) &&
                    bType.min.lte(aType.min)) {
                    a = a.cast(bType);
                }
                else ;
            }
        }
    }
    return { a, b };
}
/** C++11 integral promotion. */
function promote(n) {
    // An rvalue of type char, signed char, unsigned char, short int, or
    // unsigned short int can be converted to an rvalue of type int if int
    // can represent all the values of the source type; otherwise, the source
    // rvalue can be converted to an rvalue of type unsigned int.
    let rv = n;
    const type = n.constructor;
    if (type.byteWidth < 4) {
        rv = n.cast(Int32);
    }
    return rv;
}

/** Return a ABI definition for given ABISerializableType. */
function synthesizeABI(type) {
    const structs = [];
    const variants = [];
    const aliases = [];
    const seen = new Set();
    const resolveAbiType = (t) => {
        let typeName;
        if (typeof t.type !== 'string') {
            typeName = resolve(t.type);
        }
        else {
            typeName = t.type;
        }
        if (t.array === true) {
            typeName += '[]';
        }
        if (t.optional === true) {
            typeName += '?';
        }
        if (t.extension === true) {
            typeName += '$';
        }
        return typeName;
    };
    const resolve = (t) => {
        if (!t.abiName) {
            throw new Error('Encountered non-conforming type');
        }
        else if (t.abiName === '__struct') {
            throw new Error('Misconfigured Struct subclass, did you forget @Struct.type?');
        }
        if (seen.has(t)) {
            return t.abiName;
        }
        seen.add(t);
        if (t.abiAlias) {
            aliases.push({
                new_type_name: t.abiName,
                type: resolveAbiType(t.abiAlias),
            });
        }
        else if (t.abiFields) {
            const fields = t.abiFields.map((field) => {
                return {
                    name: field.name,
                    type: resolveAbiType(field),
                };
            });
            const struct = {
                base: t.abiBase ? resolve(t.abiBase) : '',
                name: t.abiName,
                fields,
            };
            structs.push(struct);
        }
        else if (t.abiVariant) {
            const variant = {
                name: t.abiName,
                types: t.abiVariant.map(resolveAbiType),
            };
            variants.push(variant);
        }
        return t.abiName;
    };
    const root = resolve(type);
    return { abi: ABI.from({ structs, variants, types: aliases }), types: Array.from(seen), root };
}
function abiTypeString(type) {
    let typeName = typeof type.type === 'string' ? type.type : type.type.abiName;
    if (type.array === true) {
        typeName += '[]';
    }
    if (type.optional === true) {
        typeName += '?';
    }
    if (type.extension === true) {
        typeName += '$';
    }
    return typeName;
}
function isTypeDescriptor(type) {
    return (typeof type !== 'string' &&
        type.abiName === undefined &&
        type.type !== undefined);
}
function toTypeDescriptor(type) {
    if (typeof type === 'string') {
        return { type };
    }
    if (typeof type.abiName !== 'undefined') {
        return { type: type };
    }
    return type;
}

const StringType = {
    abiName: 'string',
    abiDefault: () => '',
    fromABI: (decoder) => {
        return decoder.readString();
    },
    from: (string) => string,
    toABI: (string, encoder) => {
        encoder.writeString(string);
    },
};
const BoolType = {
    abiName: 'bool',
    abiDefault: () => false,
    fromABI: (decoder) => {
        return decoder.readByte() === 1;
    },
    from: (value) => value,
    toABI: (value, encoder) => {
        encoder.writeByte(value === true ? 1 : 0);
    },
};
function getBuiltins() {
    return [
        // types represented by JavaScript builtins
        BoolType,
        StringType,
        // types represented by Classes
        Asset,
        Asset.Symbol,
        Asset.SymbolCode,
        BlockTimestamp,
        Bytes,
        Checksum160,
        Checksum256,
        Checksum512,
        ExtendedAsset,
        Float128,
        Float32,
        Float64,
        Int128,
        Int16,
        Int32,
        Int64,
        Int8,
        Name,
        PublicKey,
        Signature,
        TimePoint,
        TimePointSec,
        UInt128,
        UInt16,
        UInt32,
        UInt64,
        UInt8,
        VarInt,
        VarUInt,
    ];
}
function buildTypeLookup(additional = []) {
    const rv = {};
    const builtins = getBuiltins();
    for (const type of builtins) {
        rv[type.abiName] = type;
    }
    for (const type of additional) {
        if (!type.abiName) {
            throw new Error('Invalid type');
        }
        rv[type.abiName] = type;
    }
    return rv;
}
function getTypeName(object) {
    if (object.constructor && object.constructor.abiName !== undefined) {
        return object.constructor.abiName;
    }
    if (Array.isArray(object)) {
        const types = object.map(getTypeName);
        const type = types[0];
        if (!type || !types.every((t) => t === type)) {
            return;
        }
        return type + '[]';
    }
    switch (typeof object) {
        case 'boolean':
            return 'bool';
        case 'string':
            return 'string';
    }
}
function getType(object, name = 'jsobj') {
    var _a;
    if (object.constructor && object.constructor.abiName !== undefined) {
        return object.constructor;
    }
    if (Array.isArray(object)) {
        // check for array of all ABISerializableType with same type name
        const types = object.map((v) => {
            return getType(v, name);
        });
        const type = types[0];
        if (!type) {
            return; // some type not known
        }
        if (!types.every((t) => t && t.abiName === type.abiName)) {
            return; // not all types are the same
        }
        return type;
    }
    const objectType = typeof object;
    if (objectType === 'object' && object !== null) {
        const fields = Object.keys(object).map((key) => {
            return { name: key, type: getType(object[key], name + '_nested') };
        });
        if (fields.find((field) => !field.type)) {
            return; // encountered unknown type
        }
        return _a = class extends Struct {
            },
            _a.abiName = name,
            _a.abiFields = fields,
            _a;
    }
    switch (objectType) {
        case 'boolean':
            return BoolType;
        case 'string':
            return StringType;
    }
}

/**
 * Antelope/EOSIO ABI Decoder
 */
class DecodingError extends Error {
    constructor(ctx, underlyingError) {
        const path = ctx.codingPath
            .map(({ field, type }) => {
            if (typeof field === 'number') {
                return field;
            }
            else {
                return `${field}<${type.typeName}>`;
            }
        })
            .join('.');
        super(`Decoding error at ${path}: ${underlyingError.message}`);
        this.stack = underlyingError.stack;
        this.ctx = ctx;
        this.underlyingError = underlyingError;
    }
}
DecodingError.__className = 'DecodingError';
function abiDecode(args) {
    const descriptor = toTypeDescriptor(args.type);
    const typeName = abiTypeString(descriptor);
    const customTypes = args.customTypes || [];
    let abi;
    if (args.abi) {
        abi = ABI.from(args.abi);
    }
    else {
        try {
            let type;
            if (typeof descriptor.type === 'string') {
                const lookup = buildTypeLookup(customTypes);
                const rName = new ABI.ResolvedType(descriptor.type).name; // type name w/o suffixes
                type = lookup[rName];
                if (!type) {
                    throw new Error(`Unknown type: ${descriptor.type}`);
                }
            }
            else {
                type = descriptor.type;
            }
            const synthesized = synthesizeABI(type);
            abi = synthesized.abi;
            customTypes.push(...synthesized.types);
        }
        catch (error) {
            throw Error(`Unable to synthesize ABI for: ${typeName} (${error.message}). ` +
                'To decode non-class types you need to pass the ABI definition manually.');
        }
    }
    const resolved = abi.resolveType(typeName);
    if (typeof descriptor.type !== 'string') {
        customTypes.unshift(descriptor.type);
    }
    const ctx = {
        types: buildTypeLookup(customTypes),
        strictExtensions: args.strictExtensions || false,
        codingPath: [{ field: 'root', type: resolved }],
    };
    try {
        if (args.data || args.data === '') {
            let decoder;
            if (isInstanceOf(args.data, ABIDecoder)) {
                decoder = args.data;
            }
            else {
                const bytes = Bytes.from(args.data);
                const fatal = args.ignoreInvalidUTF8 === undefined ? true : !args.ignoreInvalidUTF8;
                decoder = new ABIDecoder(bytes.array, new TextDecoder('utf-8', { fatal }));
            }
            if (args.metadata) {
                decoder.metadata = args.metadata;
            }
            return decodeBinary(resolved, decoder, ctx);
        }
        else if (args.object !== undefined) {
            return decodeObject(args.object, resolved, ctx);
        }
        else if (args.json) {
            return decodeObject(JSON.parse(args.json), resolved, ctx);
        }
        else {
            throw new Error('Nothing to decode, you must set one of data, json, object');
        }
    }
    catch (error) {
        throw new DecodingError(ctx, error);
    }
}
/** Marker for objects when they have been resolved, i.e. their types `from` factory method will not need to resolve children. */
const Resolved = Symbol('Resolved');
function decodeBinary(type, decoder, ctx) {
    if (ctx.codingPath.length > 32) {
        throw new Error('Maximum decoding depth exceeded');
    }
    if (type.isExtension) {
        if (!decoder.canRead()) {
            if (ctx.strictExtensions) {
                return defaultValue(type, ctx);
            }
            else {
                return null;
            }
        }
    }
    if (type.isOptional) {
        if (decoder.readByte() === 0) {
            return null;
        }
    }
    if (type.isArray) {
        const len = decoder.readVaruint32();
        const rv = [];
        for (let i = 0; i < len; i++) {
            ctx.codingPath.push({ field: i, type });
            rv.push(decodeInner());
            ctx.codingPath.pop();
        }
        return rv;
    }
    else {
        return decodeInner();
    }
    function decodeInner() {
        const abiType = ctx.types[type.name];
        if (abiType && abiType.fromABI) {
            return abiType.fromABI(decoder);
        }
        else {
            if (type.ref) {
                // follow type alias
                ctx.codingPath.push({ field: '', type: type.ref });
                const rv = decodeBinary(type.ref, decoder, ctx);
                ctx.codingPath.pop();
                return rv;
            }
            else if (type.fields) {
                const fields = type.allFields;
                if (!fields) {
                    throw new Error('Invalid struct fields');
                }
                const rv = {};
                for (const field of fields) {
                    ctx.codingPath.push({ field: field.name, type: field.type });
                    rv[field.name] = decodeBinary(field.type, decoder, ctx);
                    ctx.codingPath.pop();
                }
                if (abiType) {
                    rv[Resolved] = true;
                    return abiType.from(rv);
                }
                else {
                    return rv;
                }
            }
            else if (type.variant) {
                const vIdx = decoder.readByte();
                const vType = type.variant[vIdx];
                if (!vType) {
                    throw new Error(`Unknown variant idx: ${vIdx}`);
                }
                ctx.codingPath.push({ field: `v${vIdx}`, type: vType });
                const rv = [vType.typeName, decodeBinary(vType, decoder, ctx)];
                ctx.codingPath.pop();
                if (abiType) {
                    return abiType.from(rv);
                }
                else {
                    return rv;
                }
            }
            else if (abiType) {
                throw new Error('Invalid type');
            }
            else {
                throw new Error(type.name === 'any' ? "Unable to decode 'any' type from binary" : 'Unknown type');
            }
        }
    }
}
function decodeObject(value, type, ctx) {
    if (value === null || value === undefined) {
        if (type.isOptional) {
            return null;
        }
        if (type.isExtension) {
            if (ctx.strictExtensions) {
                return defaultValue(type, ctx);
            }
            else {
                return null;
            }
        }
        throw new Error(`Unexpectedly encountered ${value} for non-optional (${ctx.codingPath
            .map((path) => path.field)
            .join('.')})`);
    }
    else if (type.isArray) {
        if (!Array.isArray(value)) {
            throw new Error('Expected array');
        }
        const rv = [];
        const len = value.length;
        for (let i = 0; i < len; i++) {
            ctx.codingPath.push({ field: i, type });
            rv.push(decodeInner(value[i]));
            ctx.codingPath.pop();
        }
        return rv;
    }
    else {
        return decodeInner(value);
    }
    function decodeInner(value) {
        const abiType = ctx.types[type.name];
        if (type.ref && !abiType) {
            // follow type alias
            return decodeObject(value, type.ref, ctx);
        }
        else if (type.fields) {
            if (typeof value !== 'object') {
                throw new Error('Expected object');
            }
            if (typeof abiType === 'function' && isInstanceOf(value, abiType)) {
                return value;
            }
            const fields = type.allFields;
            if (!fields) {
                throw new Error('Invalid struct fields');
            }
            const struct = {};
            for (const field of fields) {
                ctx.codingPath.push({ field: field.name, type: field.type });
                struct[field.name] = decodeObject(value[field.name], field.type, ctx);
                ctx.codingPath.pop();
            }
            if (abiType) {
                struct[Resolved] = true;
                return abiType.from(struct);
            }
            else {
                return struct;
            }
        }
        else if (type.variant) {
            let vName;
            if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string') {
                vName = value[0];
                value = value[1];
            }
            else if (isInstanceOf(value, Variant)) {
                vName = value.variantName;
                value = value.value;
            }
            else {
                vName = getTypeName(value);
            }
            const vIdx = type.variant.findIndex((t) => t.typeName === vName);
            if (vIdx === -1) {
                throw new Error(`Unknown variant type: ${vName}`);
            }
            const vType = type.variant[vIdx];
            ctx.codingPath.push({ field: `v${vIdx}`, type: vType });
            const rv = [vType.typeName, decodeObject(value, vType, ctx)];
            ctx.codingPath.pop();
            if (abiType) {
                rv[Resolved] = true;
                return abiType.from(rv);
            }
            else {
                return rv;
            }
        }
        else {
            if (!abiType) {
                // special case for `any` when decoding from object
                if (type.name === 'any') {
                    return value;
                }
                throw new Error('Unknown type');
            }
            return abiType.from(value);
        }
    }
}
/** Return default value (aka initialized value, matching C++ where possible) for given type */
function defaultValue(type, ctx, seen = new Set()) {
    if (type.isArray) {
        return [];
    }
    if (type.isOptional) {
        return null;
    }
    const abiType = ctx.types[type.name];
    if (abiType && abiType.abiDefault) {
        return abiType.abiDefault();
    }
    if (seen.has(type.name)) {
        throw new Error('Circular type reference');
    }
    seen.add(type.name);
    if (type.allFields) {
        const rv = {};
        for (const field of type.allFields) {
            ctx.codingPath.push({ field: field.name, type: field.type });
            rv[field.name] = defaultValue(field.type, ctx, seen);
            ctx.codingPath.pop();
        }
        if (abiType) {
            rv[Resolved] = true;
            return abiType.from(rv);
        }
        return rv;
    }
    if (type.variant && type.variant.length > 0) {
        const rv = [type.variant[0].typeName, defaultValue(type.variant[0], ctx)];
        if (abiType) {
            rv[Resolved] = true;
            return abiType.from(rv);
        }
        return rv;
    }
    if (type.ref) {
        ctx.codingPath.push({ field: '', type: type.ref });
        const rv = defaultValue(type.ref, ctx, seen);
        ctx.codingPath.pop();
        return rv;
    }
    throw new Error('Unable to determine default value');
}
class ABIDecoder {
    constructor(array, textDecoder) {
        this.array = array;
        this.pos = 0;
        /** User declared metadata, can be used to pass info to instances when decoding.  */
        this.metadata = {};
        this.textDecoder = textDecoder || new TextDecoder('utf-8', { fatal: true });
        this.data = new DataView(array.buffer, array.byteOffset, array.byteLength);
    }
    canRead(bytes = 1) {
        return !(this.pos + bytes > this.array.byteLength);
    }
    ensure(bytes) {
        if (!this.canRead(bytes)) {
            throw new Error('Read past end of buffer');
        }
    }
    setPosition(pos) {
        if (pos < 0 || pos > this.array.byteLength) {
            throw new Error('Invalid position');
        }
        this.pos = pos;
    }
    getPosition() {
        return this.pos;
    }
    advance(bytes) {
        this.ensure(bytes);
        this.pos += bytes;
    }
    /** Read one byte. */
    readByte() {
        this.ensure(1);
        return this.array[this.pos++];
    }
    /** Read floating point as JavaScript number, 32 or 64 bits. */
    readFloat(byteWidth) {
        this.ensure(byteWidth);
        let rv;
        switch (byteWidth) {
            case 4:
                rv = this.data.getFloat32(this.pos, true);
                break;
            case 8:
                rv = this.data.getFloat64(this.pos, true);
                break;
            default:
                throw new Error('Invalid float size');
        }
        this.pos += byteWidth;
        return rv;
    }
    readVaruint32() {
        let v = 0;
        let bit = 0;
        for (;;) {
            const b = this.readByte();
            v |= (b & 0x7f) << bit;
            bit += 7;
            if (!(b & 0x80)) {
                break;
            }
        }
        return v >>> 0;
    }
    readVarint32() {
        const v = this.readVaruint32();
        if (v & 1) {
            return (~v >> 1) | 2147483648;
        }
        else {
            return v >>> 1;
        }
    }
    readArray(length) {
        this.ensure(length);
        const rv = this.array.subarray(this.pos, this.pos + length);
        this.pos += length;
        return rv;
    }
    readString() {
        const length = this.readVaruint32();
        return this.textDecoder.decode(this.readArray(length));
    }
}
ABIDecoder.__className = 'ABIDecoder';

/**
 * Antelope/EOSIO ABI Encoder
 */
class EncodingError extends Error {
    constructor(ctx, underlyingError) {
        const path = ctx.codingPath
            .map(({ field, type }) => {
            if (typeof field === 'number') {
                return field;
            }
            else {
                return `${field}<${type.typeName}>`;
            }
        })
            .join('.');
        super(`Encoding error at ${path}: ${underlyingError.message}`);
        this.stack = underlyingError.stack;
        this.ctx = ctx;
        this.underlyingError = underlyingError;
    }
}
EncodingError.__className = 'EncodingError';
function abiEncode(args) {
    let type;
    let typeName;
    if (typeof args.type === 'string') {
        typeName = args.type;
    }
    else if (args.type && isTypeDescriptor(args.type)) {
        if (typeof args.type.type !== 'string') {
            type = args.type.type;
        }
        typeName = abiTypeString(args.type);
    }
    else if (args.type && args.type.abiName !== undefined) {
        type = args.type;
        typeName = args.type.abiName;
    }
    else {
        type = getType(args.object);
        if (type) {
            typeName = type.abiName;
            if (Array.isArray(args.object)) {
                typeName += '[]';
            }
        }
    }
    const customTypes = args.customTypes ? args.customTypes.slice() : [];
    if (type) {
        customTypes.unshift(type);
    }
    else if (typeName) {
        const rootName = new ABI.ResolvedType(typeName).name;
        type = customTypes.find((t) => t.abiName === rootName);
    }
    let rootType;
    if (args.abi && typeName) {
        rootType = ABI.from(args.abi).resolveType(typeName);
    }
    else if (type) {
        const synthesized = synthesizeABI(type);
        rootType = synthesized.abi.resolveType(typeName || type.abiName);
        customTypes.push(...synthesized.types);
    }
    else if (typeName) {
        rootType = new ABI.ResolvedType(typeName);
    }
    else {
        throw new Error('Unable to determine the type of the object to be encoded. ' +
            'To encode custom ABI types you must pass the type argument.');
    }
    const types = buildTypeLookup(customTypes);
    const encoder = args.encoder || new ABIEncoder();
    if (args.metadata) {
        encoder.metadata = args.metadata;
    }
    const ctx = {
        types,
        encoder,
        codingPath: [{ field: 'root', type: rootType }],
    };
    try {
        encodeAny(args.object, rootType, ctx);
    }
    catch (error) {
        throw new EncodingError(ctx, error);
    }
    return Bytes.from(encoder.getData());
}
function encodeAny(value, type, ctx) {
    const valueExists = value !== undefined && value !== null;
    if (type.isOptional) {
        ctx.encoder.writeByte(valueExists ? 1 : 0);
        if (!valueExists) {
            return;
        }
    }
    if (type.isArray) {
        if (!Array.isArray(value)) {
            throw new Error(`Expected array for: ${type.typeName}`);
        }
        const len = value.length;
        ctx.encoder.writeVaruint32(len);
        for (let i = 0; i < len; i++) {
            ctx.codingPath.push({ field: i, type });
            encodeInner(value[i]);
            ctx.codingPath.pop();
        }
    }
    else {
        encodeInner(value);
    }
    function encodeInner(value) {
        const abiType = ctx.types[type.name];
        if (type.ref && !abiType) {
            // type is alias, follow it
            encodeAny(value, type.ref, ctx);
            return;
        }
        if (!valueExists) {
            if (type.isExtension) {
                return;
            }
            throw new Error(`Found ${value} for non-optional type: ${type.typeName} (${ctx.codingPath
                .map((path) => path.field)
                .join('.')})`);
        }
        if (abiType && abiType.toABI) {
            // type explicitly handles encoding
            abiType.toABI(value, ctx.encoder);
        }
        else if (typeof value.toABI === 'function' && value.constructor.abiName === type.name) {
            // instance handles encoding
            value.toABI(ctx.encoder);
        }
        else {
            // encode according to abi def if possible
            if (type.fields) {
                if (typeof value !== 'object') {
                    throw new Error(`Expected object for: ${type.name}`);
                }
                const fields = type.allFields;
                if (!fields) {
                    throw new Error('Invalid struct fields');
                }
                for (const field of fields) {
                    ctx.codingPath.push({ field: field.name, type: field.type });
                    encodeAny(value[field.name], field.type, ctx);
                    ctx.codingPath.pop();
                }
            }
            else if (type.variant) {
                let vName;
                if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string') {
                    vName = value[0];
                    value = value[1];
                }
                else if (isInstanceOf(value, Variant)) {
                    vName = value.variantName;
                    value = value.value;
                }
                else {
                    vName = getTypeName(value);
                }
                const vIdx = type.variant.findIndex((t) => t.typeName === vName);
                if (vIdx === -1) {
                    const types = type.variant.map((t) => `'${t.typeName}'`).join(', ');
                    throw new Error(`Unknown variant type '${vName}', expected one of ${types}`);
                }
                const vType = type.variant[vIdx];
                ctx.encoder.writeVaruint32(vIdx);
                ctx.codingPath.push({ field: `v${vIdx}`, type: vType });
                encodeAny(value, vType, ctx);
                ctx.codingPath.pop();
            }
            else {
                if (!abiType) {
                    throw new Error(type.name === 'any' ? 'Unable to encode any type to binary' : 'Unknown type');
                }
                const instance = abiType.from(value);
                if (!instance.toABI) {
                    throw new Error(`Invalid type ${type.name}, no encoding methods implemented`);
                }
                instance.toABI(ctx.encoder);
            }
        }
    }
}
class ABIEncoder {
    constructor(pageSize = 1024) {
        this.pageSize = pageSize;
        this.pos = 0;
        this.textEncoder = new TextEncoder();
        /** User declared metadata, can be used to pass info to instances when encoding.  */
        this.metadata = {};
        const buffer = new ArrayBuffer(pageSize);
        this.data = new DataView(buffer);
        this.array = new Uint8Array(buffer);
    }
    ensure(bytes) {
        if (this.data.byteLength >= this.pos + bytes) {
            return;
        }
        const pages = Math.ceil(bytes / this.pageSize);
        const newSize = this.data.byteLength + this.pageSize * pages;
        const buffer = new ArrayBuffer(newSize);
        const data = new DataView(buffer);
        const array = new Uint8Array(buffer);
        array.set(this.array);
        this.data = data;
        this.array = array;
    }
    /** Write a single byte. */
    writeByte(byte) {
        this.ensure(1);
        this.array[this.pos++] = byte;
    }
    /** Write an array of bytes. */
    writeArray(bytes) {
        const size = bytes.length;
        this.ensure(size);
        this.array.set(bytes, this.pos);
        this.pos += size;
    }
    writeFloat(value, byteWidth) {
        this.ensure(byteWidth);
        switch (byteWidth) {
            case 4:
                this.data.setFloat32(this.pos, value, true);
                break;
            case 8:
                this.data.setFloat64(this.pos, value, true);
                break;
            default:
                throw new Error('Invalid float size');
        }
        this.pos += byteWidth;
    }
    writeVaruint32(v) {
        this.ensure(4);
        for (;;) {
            if (v >>> 7) {
                this.array[this.pos++] = 0x80 | (v & 0x7f);
                v = v >>> 7;
            }
            else {
                this.array[this.pos++] = v;
                break;
            }
        }
    }
    writeVarint32(v) {
        this.writeVaruint32((v << 1) ^ (v >> 31));
    }
    writeString(v) {
        const data = this.textEncoder.encode(v);
        this.writeVaruint32(data.byteLength);
        this.writeArray(data);
    }
    getData() {
        return new Uint8Array(this.array.buffer, this.array.byteOffset, this.pos);
    }
    getBytes() {
        return new Bytes(this.getData());
    }
}
ABIEncoder.__className = 'ABIEncoder';

class ABI {
    constructor(args) {
        this.version = args.version || ABI.version;
        this.types = args.types || [];
        this.variants = args.variants || [];
        this.structs = args.structs || [];
        this.actions = args.actions || [];
        this.tables = args.tables || [];
        this.ricardian_clauses = args.ricardian_clauses || [];
        this.action_results = args.action_results || [];
    }
    static from(value) {
        if (isInstanceOf(value, ABI)) {
            return value;
        }
        if (isInstanceOf(value, Blob)) {
            return abiDecode({
                data: value.array,
                type: this,
            });
        }
        if (typeof value === 'string') {
            return new ABI(JSON.parse(value));
        }
        return new ABI(value);
    }
    static fromABI(decoder) {
        const version = decoder.readString();
        const types = [];
        const numTypes = decoder.readVaruint32();
        for (let i = 0; i < numTypes; i++) {
            types.push({ new_type_name: decoder.readString(), type: decoder.readString() });
        }
        const structs = [];
        const numStructs = decoder.readVaruint32();
        for (let i = 0; i < numStructs; i++) {
            const name = decoder.readString();
            const base = decoder.readString();
            const numFields = decoder.readVaruint32();
            const fields = [];
            for (let j = 0; j < numFields; j++) {
                fields.push({ name: decoder.readString(), type: decoder.readString() });
            }
            structs.push({ base, name, fields });
        }
        const actions = [];
        const numActions = decoder.readVaruint32();
        for (let i = 0; i < numActions; i++) {
            const name = Name.fromABI(decoder);
            const type = decoder.readString();
            const ricardian_contract = decoder.readString();
            actions.push({ name, type, ricardian_contract });
        }
        const tables = [];
        const numTables = decoder.readVaruint32();
        for (let i = 0; i < numTables; i++) {
            const name = Name.fromABI(decoder);
            const index_type = decoder.readString();
            const key_names = [];
            const numKeyNames = decoder.readVaruint32();
            for (let j = 0; j < numKeyNames; j++) {
                key_names.push(decoder.readString());
            }
            const key_types = [];
            const numKeyTypes = decoder.readVaruint32();
            for (let j = 0; j < numKeyTypes; j++) {
                key_types.push(decoder.readString());
            }
            const type = decoder.readString();
            tables.push({ name, index_type, key_names, key_types, type });
        }
        const ricardian_clauses = [];
        const numClauses = decoder.readVaruint32();
        for (let i = 0; i < numClauses; i++) {
            const id = decoder.readString();
            const body = decoder.readString();
            ricardian_clauses.push({ id, body });
        }
        // error_messages, never used?
        const numErrors = decoder.readVaruint32();
        for (let i = 0; i < numErrors; i++) {
            decoder.advance(8); // uint64 error_code
            decoder.advance(decoder.readVaruint32()); // string error_msgr
        }
        // extensions, not used
        const numExtensions = decoder.readVaruint32();
        for (let i = 0; i < numExtensions; i++) {
            decoder.advance(2); // uint16 type
            decoder.advance(decoder.readVaruint32()); // bytes data
        }
        // variants is a binary extension for some reason even though extensions are defined on the type
        const variants = [];
        if (decoder.canRead()) {
            const numVariants = decoder.readVaruint32();
            for (let i = 0; i < numVariants; i++) {
                const name = decoder.readString();
                const types = [];
                const numTypes = decoder.readVaruint32();
                for (let j = 0; j < numTypes; j++) {
                    types.push(decoder.readString());
                }
                variants.push({ name, types });
            }
        }
        const action_results = [];
        if (decoder.canRead()) {
            const numActionResults = decoder.readVaruint32();
            for (let i = 0; i < numActionResults; i++) {
                const name = Name.fromABI(decoder);
                const result_type = decoder.readString();
                action_results.push({ name, result_type });
            }
        }
        return new ABI({
            version,
            types,
            structs,
            actions,
            tables,
            ricardian_clauses,
            variants,
            action_results,
        });
    }
    toABI(encoder) {
        encoder.writeString(this.version);
        encoder.writeVaruint32(this.types.length);
        for (const type of this.types) {
            encoder.writeString(type.new_type_name);
            encoder.writeString(type.type);
        }
        encoder.writeVaruint32(this.structs.length);
        for (const struct of this.structs) {
            encoder.writeString(struct.name);
            encoder.writeString(struct.base);
            encoder.writeVaruint32(struct.fields.length);
            for (const field of struct.fields) {
                encoder.writeString(field.name);
                encoder.writeString(field.type);
            }
        }
        encoder.writeVaruint32(this.actions.length);
        for (const action of this.actions) {
            Name.from(action.name).toABI(encoder);
            encoder.writeString(action.type);
            encoder.writeString(action.ricardian_contract);
        }
        encoder.writeVaruint32(this.tables.length);
        for (const table of this.tables) {
            Name.from(table.name).toABI(encoder);
            encoder.writeString(table.index_type);
            encoder.writeVaruint32(table.key_names.length);
            for (const key of table.key_names) {
                encoder.writeString(key);
            }
            encoder.writeVaruint32(table.key_types.length);
            for (const key of table.key_types) {
                encoder.writeString(key);
            }
            encoder.writeString(table.type);
        }
        encoder.writeVaruint32(this.ricardian_clauses.length);
        for (const clause of this.ricardian_clauses) {
            encoder.writeString(clause.id);
            encoder.writeString(clause.body);
        }
        encoder.writeVaruint32(0); // error_messages
        encoder.writeVaruint32(0); // extensions
        encoder.writeVaruint32(this.variants.length);
        for (const variant of this.variants) {
            encoder.writeString(variant.name);
            encoder.writeVaruint32(variant.types.length);
            for (const type of variant.types) {
                encoder.writeString(type);
            }
        }
        encoder.writeVaruint32(this.action_results.length);
        for (const result of this.action_results) {
            Name.from(result.name).toABI(encoder);
            encoder.writeString(result.result_type);
        }
    }
    resolveType(name) {
        const types = {};
        return this.resolve({ name, types }, { id: 0 });
    }
    resolveAll() {
        const types = {};
        const ctx = { id: 0 };
        return {
            types: this.types.map((t) => this.resolve({ name: t.new_type_name, types }, ctx)),
            variants: this.variants.map((t) => this.resolve({ name: t.name, types }, ctx)),
            structs: this.structs.map((t) => this.resolve({ name: t.name, types }, ctx)),
        };
    }
    resolve({ name, types }, ctx) {
        const existing = types[name];
        if (existing) {
            return existing;
        }
        const type = new ABI.ResolvedType(name, ++ctx.id);
        types[type.typeName] = type;
        const alias = this.types.find((typeDef) => typeDef.new_type_name == type.name);
        if (alias) {
            type.ref = this.resolve({ name: alias.type, types }, ctx);
            return type;
        }
        const struct = this.getStruct(type.name);
        if (struct) {
            if (struct.base) {
                type.base = this.resolve({ name: struct.base, types }, ctx);
            }
            type.fields = struct.fields.map((field) => {
                return {
                    name: field.name,
                    type: this.resolve({ name: field.type, types }, ctx),
                };
            });
            return type;
        }
        const variant = this.getVariant(type.name);
        if (variant) {
            type.variant = variant.types.map((name) => this.resolve({ name, types }, ctx));
            return type;
        }
        // builtin or unknown type
        return type;
    }
    getStruct(name) {
        return this.structs.find((struct) => struct.name == name);
    }
    getVariant(name) {
        return this.variants.find((variant) => variant.name == name);
    }
    /** Return arguments type of an action in this ABI. */
    getActionType(actionName) {
        const name = Name.from(actionName).toString();
        const action = this.actions.find((a) => a.name.toString() === name);
        if (action) {
            return action.type;
        }
    }
    equals(other) {
        const o = ABI.from(other);
        if (this.version != o.version ||
            this.types.length != o.types.length ||
            this.structs.length != o.structs.length ||
            this.actions.length != o.actions.length ||
            this.tables.length != o.tables.length ||
            this.ricardian_clauses.length != o.ricardian_clauses.length ||
            this.variants.length != o.variants.length ||
            this.action_results.length != o.action_results.length) {
            return false;
        }
        return abiEncode({ object: this }).equals(abiEncode({ object: o }));
    }
    toJSON() {
        return {
            version: this.version,
            types: this.types,
            structs: this.structs,
            actions: this.actions,
            tables: this.tables,
            ricardian_clauses: this.ricardian_clauses,
            error_messages: [],
            abi_extensions: [],
            variants: this.variants,
            action_results: this.action_results,
        };
    }
}
ABI.abiName = 'abi';
ABI.version = 'eosio::abi/1.1';
(function (ABI) {
    class ResolvedType {
        constructor(fullName, id = 0) {
            let name = fullName;
            if (name.endsWith('$')) {
                name = name.slice(0, -1);
                this.isExtension = true;
            }
            else {
                this.isExtension = false;
            }
            if (name.endsWith('?')) {
                name = name.slice(0, -1);
                this.isOptional = true;
            }
            else {
                this.isOptional = false;
            }
            if (name.endsWith('[]')) {
                name = name.slice(0, -2);
                this.isArray = true;
            }
            else {
                this.isArray = false;
            }
            this.id = id;
            this.name = name;
        }
        /**
         * Type name including suffixes: [] array, ? optional, $ binary ext
         */
        get typeName() {
            let rv = this.name;
            if (this.isArray) {
                rv += '[]';
            }
            if (this.isOptional) {
                rv += '?';
            }
            if (this.isExtension) {
                rv += '$';
            }
            return rv;
        }
        /** All fields including base struct(s), undefined if not a struct type. */
        get allFields() {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            let current = this;
            const rv = [];
            const seen = new Set();
            do {
                if (!current.fields) {
                    return; // invalid struct
                }
                if (seen.has(current.name)) {
                    return; // circular ref
                }
                for (let i = current.fields.length - 1; i >= 0; i--) {
                    rv.unshift(current.fields[i]);
                }
                seen.add(current.name);
                current = current.base;
            } while (current !== undefined);
            return rv;
        }
    }
    ABI.ResolvedType = ResolvedType;
})(ABI || (ABI = {}));

class Struct {
    static from(value) {
        if (value[Resolved] === true) {
            // objects already resolved
            return new this(value);
        }
        if (isInstanceOf(value, this)) {
            return value;
        }
        return abiDecode({ object: value, type: this });
    }
    static get structFields() {
        const rv = [];
        const walk = (t) => {
            if (t.abiBase) {
                walk(t.abiBase);
            }
            for (const field of t.abiFields || []) {
                rv.push(field);
            }
        };
        walk(this);
        return rv;
    }
    /** @internal */
    constructor(object) {
        const self = this.constructor;
        for (const field of self.structFields) {
            const isOptional = typeof field.type === 'string'
                ? new ABI.ResolvedType(String(field.type)).isOptional
                : field.optional;
            const value = object[field.name];
            if (isOptional && !value)
                continue;
            this[field.name] = value;
        }
    }
    /**
     * Return true if this struct equals the other.
     *
     * Note: This compares the ABI encoded bytes of both structs, subclasses
     *       should implement their own fast equality check when possible.
     */
    equals(other) {
        const self = this.constructor;
        if (other.constructor &&
            typeof other.constructor.abiName === 'string' &&
            other.constructor.abiName !== self.abiName) {
            return false;
        }
        return abiEncode({ object: this }).equals(abiEncode({ object: self.from(other) }));
    }
    /** @internal */
    toJSON() {
        const self = this.constructor;
        const rv = {};
        for (const field of self.structFields) {
            if (field.optional && !this[field.name])
                continue;
            rv[field.name] = this[field.name];
        }
        return rv;
    }
}
Struct.abiName = '__struct';
(function (Struct) {
    const FieldsOwner = Symbol('FieldsOwner');
    function type(name) {
        return function (struct) {
            struct.abiName = name;
            return struct;
        };
    }
    Struct.type = type;
    function field(type, options = {}) {
        return (target, name) => {
            const ctor = target.constructor;
            if (!ctor.abiFields) {
                ctor.abiFields = [];
                ctor.abiFields[FieldsOwner] = ctor;
            }
            else if (ctor.abiFields[FieldsOwner] !== ctor) {
                // if the target class isn't the owner we set the base and start new fields
                ctor.abiBase = ctor.abiFields[FieldsOwner];
                ctor.abiFields = [];
                ctor.abiFields[FieldsOwner] = ctor;
            }
            ctor.abiFields.push(Object.assign(Object.assign({}, options), { name, type }));
        };
    }
    Struct.field = field;
})(Struct || (Struct = {}));

function TypeAlias(name) {
    return function (typeAlias) {
        typeAlias.abiAlias = { type: Object.getPrototypeOf(typeAlias.prototype).constructor };
        typeAlias.abiName = name;
        return typeAlias;
    };
}

class Variant {
    static from(object) {
        if (object[Resolved]) {
            return new this(object);
        }
        if (isInstanceOf(object, this)) {
            return object;
        }
        return abiDecode({ object, type: this });
    }
    /** @internal */
    constructor(variant) {
        const abiVariant = this.constructor.abiVariant;
        this.value = variant[1];
        const variantIdx = abiVariant.map(abiTypeString).findIndex((t) => t === variant[0]);
        if (0 > variantIdx || abiVariant.length <= variantIdx) {
            throw new Error(`Unknown variant ${variant[0]}`);
        }
        this.variantIdx = variantIdx;
    }
    /**
     * Return true if this variant equals the other.
     *
     * Note: This compares the ABI encoded bytes of both variants, subclasses
     *       should implement their own fast equality check when possible.
     */
    equals(other) {
        const self = this.constructor;
        const otherVariant = self.from(other);
        if (this.variantIdx !== otherVariant.variantIdx) {
            return false;
        }
        return abiEncode({ object: this }).equals(abiEncode({ object: otherVariant }));
    }
    get variantName() {
        const variant = this.constructor.abiVariant[this.variantIdx];
        return abiTypeString(variant);
    }
    /** @internal */
    toJSON() {
        return [this.variantName, this.value];
    }
}
Variant.abiName = '__variant';
Variant.abiVariant = [];
(function (Variant) {
    function type(name, types) {
        return function (variant) {
            variant.abiName = name;
            variant.abiVariant = types.map(toTypeDescriptor);
            return variant;
        };
    }
    Variant.type = type;
})(Variant || (Variant = {}));

class Float {
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (typeof value === 'string') {
            value = Number.parseFloat(value);
        }
        else if (isInstanceOf(value, Float)) {
            value = value.value;
        }
        return new this(value);
    }
    static fromABI(decoder) {
        return new this(decoder.readFloat(this.byteWidth));
    }
    static abiDefault() {
        return this.from(0);
    }
    static random() {
        const bytes = secureRandom(this.byteWidth);
        const decoder = new ABIDecoder(bytes);
        return this.fromABI(decoder);
    }
    constructor(value) {
        this.value = value;
    }
    equals(other) {
        const self = this.constructor;
        return this.value === self.from(other).value;
    }
    toABI(encoder) {
        const self = this.constructor;
        encoder.writeFloat(this.value, self.byteWidth);
    }
    toString() {
        return this.value.toString();
    }
    toJSON() {
        return this.toString();
    }
}
Float.abiName = '__float';
class Float32 extends Float {
    toString() {
        return this.value.toFixed(7);
    }
}
Float32.abiName = 'float32';
Float32.byteWidth = 4;
class Float64 extends Float {
}
Float64.abiName = 'float64';
Float64.byteWidth = 8;
class Float128 {
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (typeof value === 'string' && value.startsWith('0x')) {
            value = value.slice(2);
        }
        return new this(Bytes.from(value));
    }
    static fromABI(decoder) {
        return new this(new Bytes(decoder.readArray(this.byteWidth)));
    }
    static random() {
        const bytes = secureRandom(16);
        const decoder = new ABIDecoder(bytes);
        return this.fromABI(decoder);
    }
    constructor(data) {
        if (data.array.length !== 16) {
            throw new Error('Invalid float128');
        }
        this.data = data;
    }
    equals(other) {
        const self = this.constructor;
        return this.data.equals(self.from(other).data);
    }
    toABI(encoder) {
        encoder.writeArray(this.data.array);
    }
    toString() {
        // float128 uses 0x prefixed hex strings as opposed to everywhere else in where there is no prefix ¯\_(ツ)_/¯
        return '0x' + this.data.hexString;
    }
    toJSON() {
        return this.toString();
    }
}
Float128.abiName = 'float128';
Float128.byteWidth = 16;

/** Antelope/EOSIO Name */
class Name {
    /**
     * The raw representation of the name.
     * @deprecated Use value instead.
     */
    get rawValue() {
        return this.value;
    }
    /** Create a new Name instance from any of its representing types. */
    static from(value) {
        if (isInstanceOf(value, Name)) {
            return value;
        }
        else if (typeof value === 'string') {
            return new Name(stringToName(value));
        }
        else if (isInstanceOf(value, UInt64)) {
            return new Name(value);
        }
        else {
            throw new Error('Invalid name');
        }
    }
    static fromABI(decoder) {
        return new Name(UInt64.fromABI(decoder));
    }
    static abiDefault() {
        return new this(UInt64.from(0));
    }
    constructor(value) {
        this.value = value;
    }
    /** Return true if this name is equal to passed name. */
    equals(other) {
        return this.value.equals(Name.from(other).value);
    }
    /** Return string representation of this name. */
    toString() {
        return nameToString(this.value);
    }
    toABI(encoder) {
        this.value.toABI(encoder);
    }
    /** @internal */
    toJSON() {
        return this.toString();
    }
}
Name.abiName = 'name';
/** Regex pattern matching a Antelope/EOSIO name, case-sensitive. */
Name.pattern = /^[a-z1-5.]{0,13}$/;
function stringToName(s) {
    function charToSymbol(c) {
        if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
            return c - 'a'.charCodeAt(0) + 6;
        }
        if (c >= '1'.charCodeAt(0) && c <= '5'.charCodeAt(0)) {
            return c - '1'.charCodeAt(0) + 1;
        }
        return 0;
    }
    const a = new Uint8Array(8);
    let bit = 63;
    for (let i = 0; i < s.length; ++i) {
        let c = charToSymbol(s.charCodeAt(i));
        if (bit < 5) {
            c = c << 1;
        }
        for (let j = 4; j >= 0; --j) {
            if (bit >= 0) {
                a[Math.floor(bit / 8)] |= ((c >> j) & 1) << bit % 8;
                --bit;
            }
        }
    }
    return UInt64.from(a);
}
function nameToString(n) {
    const a = n.value.toArray('le', 8);
    let result = '';
    for (let bit = 63; bit >= 0;) {
        let c = 0;
        for (let i = 0; i < 5; ++i) {
            if (bit >= 0) {
                c = (c << 1) | ((a[Math.floor(bit / 8)] >> bit % 8) & 1);
                --bit;
            }
        }
        if (c >= 6) {
            result += String.fromCharCode(c + 'a'.charCodeAt(0) - 6);
        }
        else if (c >= 1) {
            result += String.fromCharCode(c + '1'.charCodeAt(0) - 1);
        }
        else {
            result += '.';
        }
    }
    while (result.endsWith('.')) {
        result = result.substr(0, result.length - 1);
    }
    return result;
}

class TimePointBase {
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (isInstanceOf(value, TimePointBase)) {
            // converting between types
            return this.fromMilliseconds(value.toMilliseconds());
        }
        if (isInstanceOf(value, Date)) {
            return this.fromDate(value);
        }
        if (typeof value === 'string') {
            return this.fromString(value);
        }
        return this.fromInteger(value);
    }
    static fromString(string) {
        const value = Date.parse(string + 'Z');
        if (!Number.isFinite(value)) {
            throw new Error('Invalid date string');
        }
        return this.fromMilliseconds(value);
    }
    static fromDate(date) {
        return this.fromMilliseconds(date.getTime());
    }
    static abiDefault() {
        return this.from(0);
    }
    toABI(encoder) {
        const self = this;
        self.value.toABI(encoder);
    }
    equals(other) {
        const self = this.constructor;
        return this.toMilliseconds() === self.from(other).toMilliseconds();
    }
    toMilliseconds() {
        throw new Error('Not implemented');
    }
    toDate() {
        return new Date(this.toMilliseconds());
    }
    toJSON() {
        return this.toString();
    }
}
TimePointBase.abiName = '__time_point_base';
/** Timestamp with microsecond accuracy. */
class TimePoint extends TimePointBase {
    static fromMilliseconds(ms) {
        return new this(Int64.from(Math.round(ms * 1000)));
    }
    static fromInteger(value) {
        return new this(Int64.from(value));
    }
    static fromABI(decoder) {
        return new this(Int64.fromABI(decoder));
    }
    constructor(value) {
        super();
        this.value = value;
    }
    toString() {
        return this.toDate().toISOString().slice(0, -1);
    }
    toMilliseconds() {
        return Number(this.value.dividing(1000, 'round'));
    }
}
TimePoint.abiName = 'time_point';
/** Timestamp with second accuracy. */
class TimePointSec extends TimePointBase {
    static fromMilliseconds(ms) {
        return new this(UInt32.from(Math.round(ms / 1000)));
    }
    static fromInteger(value) {
        return new this(UInt32.from(value));
    }
    static fromABI(decoder) {
        return new this(UInt32.fromABI(decoder));
    }
    constructor(value) {
        super();
        this.value = value;
    }
    toString() {
        return this.toDate().toISOString().slice(0, -5);
    }
    toMilliseconds() {
        return Number(this.value.cast(UInt64).multiplying(1000));
    }
}
TimePointSec.abiName = 'time_point_sec';
class BlockTimestamp extends TimePointBase {
    static fromMilliseconds(ms) {
        return new this(UInt32.from(Math.round((ms - 946684800000) / 500)));
    }
    static fromInteger(value) {
        return new this(UInt32.from(value));
    }
    static fromABI(decoder) {
        return new this(UInt32.fromABI(decoder));
    }
    constructor(value) {
        super();
        this.value = value;
    }
    toString() {
        return this.toDate().toISOString().slice(0, -1);
    }
    toMilliseconds() {
        return Number(this.value.cast(UInt64).multiplying(500).adding(946684800000));
    }
}
BlockTimestamp.abiName = 'block_timestamp_type';

class Asset {
    static from(value, symbol) {
        if (isInstanceOf(value, Asset)) {
            return value;
        }
        switch (typeof value) {
            case 'number':
                if (!symbol) {
                    throw new Error('Symbol is required when creating Asset from number');
                }
                return this.fromFloat(value, symbol);
            case 'string':
                return this.fromString(value);
            default:
                throw new Error('Invalid asset');
        }
    }
    static fromString(value) {
        const parts = (typeof value === 'string' ? value : '').split(' ');
        if (parts.length !== 2) {
            throw new Error('Invalid asset string');
        }
        const amount = parts[0].replace('.', '');
        const precision = (parts[0].split('.')[1] || '').length;
        const symbol = Asset.Symbol.fromParts(parts[1], precision);
        return new Asset(Int64.from(amount), symbol);
    }
    static fromFloat(value, symbol) {
        const s = Asset.Symbol.from(symbol);
        return new Asset(s.convertFloat(value), s);
    }
    static fromUnits(value, symbol) {
        return new Asset(Int64.from(value), Asset.Symbol.from(symbol));
    }
    static fromABI(decoder) {
        const units = Int64.fromABI(decoder);
        const symbol = Asset.Symbol.fromABI(decoder);
        return new Asset(units, symbol);
    }
    static abiDefault() {
        return new this(Int64.from(0), Asset.Symbol.abiDefault());
    }
    static formatUnits(units, precision) {
        const digits = Int64.from(units).toString().split('');
        let negative = false;
        if (digits[0] === '-') {
            negative = true;
            digits.shift();
        }
        while (digits.length <= precision) {
            digits.unshift('0');
        }
        if (precision > 0) {
            digits.splice(digits.length - precision, 0, '.');
        }
        let rv = digits.join('');
        if (negative) {
            rv = '-' + rv;
        }
        return rv;
    }
    constructor(units, symbol) {
        this.units = units;
        this.symbol = symbol;
    }
    equals(other) {
        const { symbol, units } = Asset.from(other);
        return this.symbol.value.equals(symbol.value) && this.units.equals(units);
    }
    get value() {
        return this.symbol.convertUnits(this.units);
    }
    set value(newValue) {
        this.units = this.symbol.convertFloat(newValue);
    }
    get quantity() {
        return Asset.formatUnits(this.units, this.symbol.precision);
    }
    toABI(encoder) {
        this.units.toABI(encoder);
        this.symbol.toABI(encoder);
    }
    toString() {
        return this.quantity + ' ' + this.symbol.name;
    }
    toJSON() {
        return this.toString();
    }
}
Asset.abiName = 'asset';
(function (Asset) {
    class Symbol {
        static from(value) {
            if (isInstanceOf(value, Symbol)) {
                return value;
            }
            if (isInstanceOf(value, UInt64)) {
                return new Symbol(value);
            }
            const parts = value.split(',');
            if (parts.length !== 2 && value !== '0,') {
                throw new Error('Invalid symbol string');
            }
            if (value === '0,') {
                parts.push('');
            }
            const precision = Number.parseInt(parts[0]);
            return Symbol.fromParts(parts[1], precision);
        }
        static fromParts(name, precision) {
            return new Symbol(toRawSymbol(name, precision));
        }
        // eslint-disable-next-line @typescript-eslint/ban-types
        static fromABI(decoder) {
            return new Symbol(UInt64.fromABI(decoder));
        }
        static abiDefault() {
            return this.from('4,SYS'); // CORE_SYMBOL = 4,CORE_SYMBOL_NAME
        }
        constructor(value) {
            if (toSymbolPrecision(value) > Symbol.maxPrecision) {
                throw new Error('Invalid asset symbol, precision too large');
            }
            if (!value.equals(0) && !SymbolCode.pattern.test(toSymbolName(value))) {
                throw new Error('Invalid asset symbol, name must be uppercase A-Z');
            }
            this.value = value;
        }
        equals(other) {
            return this.value.equals(Symbol.from(other).value);
        }
        get name() {
            return toSymbolName(this.value);
        }
        get precision() {
            return toSymbolPrecision(this.value);
        }
        get code() {
            return new SymbolCode(UInt64.from(this.value.value.clone().iushrn(8)));
        }
        toABI(encoder) {
            this.value.toABI(encoder);
        }
        /**
         * Convert units to floating point number according to symbol precision.
         * @throws If the given units can't be represented in 53 bits.
         **/
        convertUnits(units) {
            return units.value.toNumber() / Math.pow(10, this.precision);
        }
        /**
         * Convert floating point to units according to symbol precision.
         * Note that the value will be rounded to closest precision.
         **/
        convertFloat(float) {
            return Int64.from(float.toFixed(this.precision).replace('.', ''));
        }
        toString() {
            return `${this.precision},${this.name}`;
        }
        toJSON() {
            return this.toString();
        }
    }
    Symbol.abiName = 'symbol';
    Symbol.maxPrecision = 18;
    Asset.Symbol = Symbol;
    class SymbolCode {
        static from(value) {
            if (isInstanceOf(value, SymbolCode)) {
                return value;
            }
            if (typeof value === 'string') {
                value = UInt64.from(toRawSymbolCode(value));
            }
            return new this(UInt64.from(value));
        }
        static fromABI(decoder) {
            return new SymbolCode(UInt64.fromABI(decoder));
        }
        static abiDefault() {
            return this.from('SYS'); // CORE_SYMBOL_NAME
        }
        constructor(value) {
            if (!value.equals(0) && !SymbolCode.pattern.test(toSymbolName(value))) {
                throw new Error('Invalid asset symbol, name must be uppercase A-Z');
            }
            this.value = value;
        }
        equals(other) {
            return this.value.equals(SymbolCode.from(other).value);
        }
        toABI(encoder) {
            this.value.toABI(encoder);
        }
        toString() {
            return charsToSymbolName(this.value.value.toArray('be'));
        }
        toJSON() {
            return this.toString();
        }
    }
    SymbolCode.abiName = 'symbol_code';
    SymbolCode.pattern = /^[A-Z]{0,7}$/;
    Asset.SymbolCode = SymbolCode;
})(Asset || (Asset = {}));
class ExtendedAsset {
    static from(value) {
        if (isInstanceOf(value, ExtendedAsset)) {
            return value;
        }
        return new this(Asset.from(value.quantity), Name.from(value.contract));
    }
    static fromABI(decoder) {
        return new ExtendedAsset(Asset.fromABI(decoder), Name.fromABI(decoder));
    }
    constructor(quantity, contract) {
        this.quantity = quantity;
        this.contract = contract;
    }
    equals(other) {
        return this.quantity.equals(other.quantity) && this.contract.equals(other.contract);
    }
    toABI(encoder) {
        this.quantity.toABI(encoder);
        this.contract.toABI(encoder);
    }
    toJSON() {
        return {
            quantity: this.quantity,
            contract: this.contract,
        };
    }
}
ExtendedAsset.abiName = 'extended_asset';
class ExtendedSymbol {
    static from(value) {
        if (isInstanceOf(value, ExtendedSymbol)) {
            return value;
        }
        return new this(Asset.Symbol.from(value.sym), Name.from(value.contract));
    }
    static fromABI(decoder) {
        return new ExtendedSymbol(Asset.Symbol.fromABI(decoder), Name.fromABI(decoder));
    }
    constructor(sym, contract) {
        this.sym = sym;
        this.contract = contract;
    }
    equals(other) {
        return this.sym.equals(other.sym) && this.contract.equals(other.contract);
    }
    toABI(encoder) {
        this.sym.toABI(encoder);
        this.contract.toABI(encoder);
    }
    toJSON() {
        return {
            sym: this.sym,
            contract: this.contract,
        };
    }
}
ExtendedSymbol.abiName = 'extended_symbol';
function toSymbolPrecision(rawSymbol) {
    return rawSymbol.value.and(UInt64.from(0xff).value).toNumber();
}
function toSymbolName(rawSymbol) {
    const chars = rawSymbol.value.toArray('be').slice(0, -1);
    return charsToSymbolName(chars);
}
function charsToSymbolName(chars) {
    return chars
        .map((char) => String.fromCharCode(char))
        .reverse()
        .join('');
}
function toRawSymbol(name, precision) {
    const code = toRawSymbolCode(name);
    const bytes = new Uint8Array(code.length + 1);
    bytes[0] = precision;
    bytes.set(code, 1);
    return UInt64.from(bytes);
}
function toRawSymbolCode(name) {
    const length = Math.min(name.length, 7);
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = name.charCodeAt(i);
    }
    return bytes;
}

exports.Base58 = void 0;
(function (Base58) {
    let ErrorCode;
    (function (ErrorCode) {
        ErrorCode["E_CHECKSUM"] = "E_CHECKSUM";
        ErrorCode["E_INVALID"] = "E_INVALID";
    })(ErrorCode = Base58.ErrorCode || (Base58.ErrorCode = {}));
    class DecodingError extends Error {
        constructor(message, code, info = {}) {
            super(message);
            this.code = code;
            this.info = info;
        }
    }
    DecodingError.__className = 'DecodingError';
    Base58.DecodingError = DecodingError;
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const charMap = new Int16Array(0xff).fill(-1);
    for (let i = 0; i < 58; ++i) {
        charMap[chars.charCodeAt(i)] = i;
    }
    /** Decode a Base58 encoded string. */
    function decode(s, size) {
        if (size == null) {
            return decodeVar(s);
        }
        const result = new Uint8Array(size);
        for (let i = 0; i < s.length; ++i) {
            let carry = charMap[s.charCodeAt(i)];
            if (carry < 0) {
                throw new DecodingError('Invalid Base58 character encountered', ErrorCode.E_INVALID, { char: s[i] });
            }
            for (let j = 0; j < size; ++j) {
                const x = result[j] * 58 + carry;
                result[j] = x;
                carry = x >> 8;
            }
            if (carry) {
                throw new DecodingError('Base58 value is out of range', ErrorCode.E_INVALID);
            }
        }
        result.reverse();
        return new Bytes(result);
    }
    Base58.decode = decode;
    /** Decode a Base58Check encoded string. */
    function decodeCheck(encoded, size) {
        const decoded = decode(encoded, size != null ? size + 4 : size);
        const data = decoded.array.subarray(0, -4);
        const expected = decoded.array.subarray(-4);
        const actual = dsha256Checksum(data);
        if (!arrayEquals(expected, actual)) {
            throw new DecodingError('Checksum mismatch', ErrorCode.E_CHECKSUM, {
                actual,
                expected,
                data,
                hash: 'double_sha256',
            });
        }
        return new Bytes(data);
    }
    Base58.decodeCheck = decodeCheck;
    /** Decode a Base58Check encoded string that uses ripemd160 instead of double sha256 for the digest. */
    function decodeRipemd160Check(encoded, size, suffix) {
        const decoded = decode(encoded, size != null ? size + 4 : size);
        const data = decoded.array.subarray(0, -4);
        const expected = decoded.array.subarray(-4);
        const actual = ripemd160Checksum(data, suffix);
        if (!arrayEquals(expected, actual)) {
            throw new DecodingError('Checksum mismatch', ErrorCode.E_CHECKSUM, {
                actual,
                expected,
                data,
                hash: 'ripemd160',
            });
        }
        return new Bytes(data);
    }
    Base58.decodeRipemd160Check = decodeRipemd160Check;
    /** Encode bytes to a Base58 string.  */
    function encode(data) {
        data = Bytes.from(data);
        const result = [];
        for (const byte of data.array) {
            let carry = byte;
            for (let j = 0; j < result.length; ++j) {
                const x = (charMap[result[j]] << 8) + carry;
                result[j] = chars.charCodeAt(x % 58);
                carry = (x / 58) | 0;
            }
            while (carry) {
                result.push(chars.charCodeAt(carry % 58));
                carry = (carry / 58) | 0;
            }
        }
        for (const byte of data.array) {
            if (byte) {
                break;
            }
            else {
                result.push('1'.charCodeAt(0));
            }
        }
        result.reverse();
        return String.fromCharCode(...result);
    }
    Base58.encode = encode;
    function encodeCheck(data) {
        data = Bytes.from(data);
        data = data.appending(dsha256Checksum(data.array));
        return encode(data);
    }
    Base58.encodeCheck = encodeCheck;
    function encodeRipemd160Check(data, suffix) {
        data = Bytes.from(data);
        data = data.appending(ripemd160Checksum(data.array, suffix));
        return encode(data);
    }
    Base58.encodeRipemd160Check = encodeRipemd160Check;
    /** @internal */
    function decodeVar(s) {
        const result = [];
        for (let i = 0; i < s.length; ++i) {
            let carry = charMap[s.charCodeAt(i)];
            if (carry < 0) {
                throw new DecodingError('Invalid Base58 character encountered', ErrorCode.E_INVALID, { char: s[i] });
            }
            for (let j = 0; j < result.length; ++j) {
                const x = result[j] * 58 + carry;
                result[j] = x & 0xff;
                carry = x >> 8;
            }
            if (carry) {
                result.push(carry);
            }
        }
        for (const ch of s) {
            if (ch === '1') {
                result.push(0);
            }
            else {
                break;
            }
        }
        result.reverse();
        return Bytes.from(result);
    }
    /** @internal */
    function ripemd160Checksum(data, suffix) {
        const hash = hash_js.ripemd160().update(data);
        if (suffix) {
            hash.update(suffix);
        }
        return new Uint8Array(hash.digest().slice(0, 4));
    }
    /** @internal */
    function dsha256Checksum(data) {
        const round1 = hash_js.sha256().update(data).digest();
        const round2 = hash_js.sha256().update(round1).digest();
        return new Uint8Array(round2.slice(0, 4));
    }
})(exports.Base58 || (exports.Base58 = {}));

class PublicKey {
    /** Create PublicKey object from representing types. */
    static from(value) {
        if (isInstanceOf(value, PublicKey)) {
            return value;
        }
        if (typeof value === 'object' && value.type && value.compressed) {
            return new PublicKey(exports.KeyType.from(value.type), new Bytes(value.compressed));
        }
        if (typeof value !== 'string') {
            throw new Error('Invalid public key');
        }
        if (value.startsWith('PUB_')) {
            const parts = value.split('_');
            if (parts.length !== 3) {
                throw new Error('Invalid public key string');
            }
            const type = exports.KeyType.from(parts[1]);
            const size = type === exports.KeyType.K1 || type === exports.KeyType.R1 || type === exports.KeyType.EM ? 33 : undefined;
            const data = exports.Base58.decodeRipemd160Check(parts[2], size, type);
            return new PublicKey(type, data);
        }
        else if (value.length >= 50) {
            // Legacy EOS key
            const data = exports.Base58.decodeRipemd160Check(value.slice(-50));
            return new PublicKey(exports.KeyType.K1, data);
        }
        else {
            throw new Error('Invalid public key string');
        }
    }
    /** @internal */
    static fromABI(decoder) {
        const type = exports.KeyType.from(decoder.readByte());
        if (type == exports.KeyType.WA) {
            const startPos = decoder.getPosition();
            decoder.advance(33); // key_data
            decoder.advance(1); // user presence
            decoder.advance(decoder.readVaruint32()); // rpid
            const len = decoder.getPosition() - startPos;
            decoder.setPosition(startPos);
            const data = Bytes.from(decoder.readArray(len));
            return new PublicKey(exports.KeyType.WA, data);
        }
        return new PublicKey(type, new Bytes(decoder.readArray(33)));
    }
    /** @internal */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
    equals(other) {
        const otherKey = PublicKey.from(other);
        return this.type === otherKey.type && this.data.equals(otherKey.data);
    }
    /**
     * Return Antelope/EOSIO legacy (`EOS<base58data>`) formatted key.
     * @throws If the key type isn't `K1` or 'EM'.
     */
    toLegacyString(prefix = 'EOS') {
        if (this.type !== exports.KeyType.K1 && this.type !== exports.KeyType.EM) {
            throw new Error('Unable to create legacy formatted string for non-K1/EM key');
        }
        return `${prefix}${exports.Base58.encodeRipemd160Check(this.data)}`;
    }
    /** Return key in modern Antelope/EOSIO format (`PUB_<type>_<base58data>`) */
    toString() {
        return `PUB_${this.type}_${exports.Base58.encodeRipemd160Check(this.data, this.type)}`;
    }
    /** @internal */
    toABI(encoder) {
        encoder.writeByte(exports.KeyType.indexFor(this.type));
        encoder.writeArray(this.data.array);
    }
    /** @internal */
    toJSON() {
        return this.toString();
    }
}
PublicKey.abiName = 'public_key';

const curves = {};
/**
 * Get curve for key type.
 * @internal
 */
function getCurve(type) {
    let rv = curves[type];
    if (!rv) {
        if (type === 'K1' || type === 'EM') {
            rv = curves[type] = new elliptic.ec('secp256k1');
        }
        else if (type === 'R1') {
            rv = curves[type] = new elliptic.ec('p256');
        }
        else {
            throw new Error(`Unknown curve type: ${type}`);
        }
    }
    return rv;
}

/**
 * Recover public key from signature and recovery id.
 * @internal
 */
function recover(signature, message, type) {
    const curve = getCurve(type);
    const recid = signature[0] - 31;
    const r = signature.subarray(1, 33);
    const s = signature.subarray(33);
    const point = curve.recoverPubKey(message, { r, s }, recid);
    return new Uint8Array(point.encodeCompressed());
}

/**
 * Verify signature using message and public key.
 * @internal
 */
function verify(signature, message, pubkey, type) {
    const curve = getCurve(type);
    const r = signature.subarray(1, 33);
    const s = signature.subarray(33);
    return curve.verify(message, { r, s }, pubkey);
}

class Signature {
    /** Create Signature object from representing types. */
    static from(value) {
        if (isInstanceOf(value, Signature)) {
            return value;
        }
        if (typeof value === 'object' && value.r && value.s) {
            const data = new Uint8Array(1 + 32 + 32);
            let recid = value.recid;
            const type = exports.KeyType.from(value.type);
            if (value.type === exports.KeyType.K1 ||
                value.type === exports.KeyType.R1 ||
                value.type === exports.KeyType.EM) {
                recid += 31;
            }
            data[0] = recid;
            data.set(value.r, 1);
            data.set(value.s, 33);
            return new Signature(type, new Bytes(data));
        }
        if (typeof value !== 'string') {
            throw new Error('Invalid signature');
        }
        if (value.startsWith('SIG_')) {
            const parts = value.split('_');
            if (parts.length !== 3) {
                throw new Error('Invalid signature string');
            }
            const type = exports.KeyType.from(parts[1]);
            const size = type === exports.KeyType.K1 || type === exports.KeyType.R1 || type === exports.KeyType.EM ? 65 : undefined;
            const data = exports.Base58.decodeRipemd160Check(parts[2], size, type);
            return new Signature(type, data);
        }
        else {
            throw new Error('Invalid signature string');
        }
    }
    /** @internal */
    static fromABI(decoder) {
        const type = exports.KeyType.from(decoder.readByte());
        if (type === exports.KeyType.WA) {
            const startPos = decoder.getPosition();
            decoder.advance(65); // compact_signature
            decoder.advance(decoder.readVaruint32()); // auth_data
            decoder.advance(decoder.readVaruint32()); // client_json
            const len = decoder.getPosition() - startPos;
            decoder.setPosition(startPos);
            const data = Bytes.from(decoder.readArray(len));
            return new Signature(exports.KeyType.WA, data);
        }
        return new Signature(type, new Bytes(decoder.readArray(65)));
    }
    /** @internal */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
    equals(other) {
        const otherSig = Signature.from(other);
        return this.type === otherSig.type && this.data.equals(otherSig.data);
    }
    /** Recover public key from given message digest. */
    recoverDigest(digest) {
        digest = Checksum256.from(digest);
        const compressed = recover(this.data.array, digest.array, this.type);
        return PublicKey.from({ compressed, type: this.type });
    }
    /** Recover public key from given message. */
    recoverMessage(message) {
        return this.recoverDigest(Checksum256.hash(message));
    }
    /** Verify this signature with given message digest and public key. */
    verifyDigest(digest, publicKey) {
        digest = Checksum256.from(digest);
        return verify(this.data.array, digest.array, publicKey.data.array, this.type);
    }
    /** Verify this signature with given message and public key. */
    verifyMessage(message, publicKey) {
        return this.verifyDigest(Checksum256.hash(message), publicKey);
    }
    /** Base58check encoded string representation of this signature (`SIG_<type>_<data>`). */
    toString() {
        return `SIG_${this.type}_${exports.Base58.encodeRipemd160Check(this.data, this.type)}`;
    }
    /** @internal */
    toABI(encoder) {
        encoder.writeByte(exports.KeyType.indexFor(this.type));
        encoder.writeArray(this.data.array);
    }
    /** @internal */
    toJSON() {
        return this.toString();
    }
}
Signature.abiName = 'signature';

/**
 * Get public key corresponding to given private key.
 * @internal
 */
function getPublic(privkey, type) {
    const curve = getCurve(type);
    const key = curve.keyFromPrivate(privkey);
    const point = key.getPublic();
    return new Uint8Array(point.encodeCompressed());
}

/**
 * Derive shared secret for key pair.
 * @internal
 */
function sharedSecret(privkey, pubkey, type) {
    const curve = getCurve(type);
    const priv = curve.keyFromPrivate(privkey);
    const pub = curve.keyFromPublic(pubkey).getPublic();
    return priv.derive(pub).toArrayLike(Uint8Array, 'be');
}

/**
 * Sign digest using private key.
 * @internal
 */
function sign(secret, message, type) {
    const curve = getCurve(type);
    const key = curve.keyFromPrivate(secret);
    let sig;
    let r;
    let s;
    if (type === 'K1') {
        let attempt = 1;
        do {
            sig = key.sign(message, { canonical: true, pers: [attempt++] });
            r = sig.r.toArrayLike(Uint8Array, 'be', 32);
            s = sig.s.toArrayLike(Uint8Array, 'be', 32);
        } while (!isCanonical(r, s));
    }
    else {
        sig = key.sign(message, { canonical: true });
        r = sig.r.toArrayLike(Uint8Array, 'be', 32);
        s = sig.s.toArrayLike(Uint8Array, 'be', 32);
    }
    return { type, r, s, recid: sig.recoveryParam || 0 };
}
/**
 * Here be dragons
 * - https://github.com/steemit/steem/issues/1944
 * - https://github.com/EOSIO/eos/issues/6699
 * @internal
 */
function isCanonical(r, s) {
    return (!(r[0] & 0x80) &&
        !(r[0] === 0 && !(r[1] & 0x80)) &&
        !(s[0] & 0x80) &&
        !(s[0] === 0 && !(s[1] & 0x80)));
}

/**
 * Generate a new private key for given type.
 * @internal
 */
function generate(type) {
    const curve = getCurve(type);
    const privkey = curve.genKeyPair().getPrivate();
    return privkey.toArrayLike(Uint8Array, 'be', 32);
}

class PrivateKey {
    /** Create PrivateKey object from representing types. */
    static from(value) {
        if (isInstanceOf(value, PrivateKey)) {
            return value;
        }
        else {
            return this.fromString(value);
        }
    }
    /**
     * Create PrivateKey object from a string representation.
     * Accepts WIF (5...) and Antelope/EOSIO (PVT_...) style private keys.
     */
    static fromString(string, ignoreChecksumError = false) {
        try {
            const { type, data } = decodeKey(string);
            return new this(type, data);
        }
        catch (error) {
            error.message = `Invalid private key (${error.message})`;
            if (ignoreChecksumError &&
                isInstanceOf(error, exports.Base58.DecodingError) &&
                error.code === exports.Base58.ErrorCode.E_CHECKSUM) {
                const type = string.startsWith('PVT_R1')
                    ? exports.KeyType.R1
                    : string.startsWith('PVT_EM')
                        ? exports.KeyType.EM
                        : exports.KeyType.K1;
                const data = new Bytes(error.info.data);
                if (data.length === 33) {
                    data.dropFirst();
                }
                data.zeropad(32, true);
                return new this(type, data);
            }
            throw error;
        }
    }
    /**
     * Generate new PrivateKey.
     * @throws If a secure random source isn't available.
     */
    static generate(type) {
        return new PrivateKey(exports.KeyType.from(type), new Bytes(generate(type)));
    }
    /** @internal */
    constructor(type, data) {
        if ((type === exports.KeyType.K1 || type === exports.KeyType.R1 || type === exports.KeyType.EM) &&
            data.length !== 32) {
            throw new Error('Invalid private key length');
        }
        this.type = type;
        this.data = data;
    }
    /**
     * Sign message digest using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signDigest(digest) {
        digest = Checksum256.from(digest);
        return Signature.from(sign(this.data.array, digest.array, this.type));
    }
    /**
     * Sign message using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signMessage(message) {
        return this.signDigest(Checksum256.hash(message));
    }
    /**
     * Derive the shared secret between this private key and given public key.
     * @throws If the key type isn't R1 or K1.
     */
    sharedSecret(publicKey) {
        const shared = sharedSecret(this.data.array, publicKey.data.array, this.type);
        return Checksum512.hash(shared);
    }
    /**
     * Get the corresponding public key.
     * @throws If the key type isn't R1 or K1.
     */
    toPublic() {
        const compressed = getPublic(this.data.array, this.type);
        return PublicKey.from({ compressed, type: this.type });
    }
    /**
     * Return WIF representation of this private key
     * @throws If the key type isn't K1/EM.
     */
    toWif() {
        if (this.type !== exports.KeyType.K1 && this.type !== exports.KeyType.EM) {
            throw new Error('Unable to generate WIF for non-k1/em key');
        }
        return exports.Base58.encodeCheck(Bytes.from([0x80]).appending(this.data));
    }
    /**
     * Return the key in Antelope/EOSIO PVT_<type>_<base58check> format.
     */
    toString() {
        return `PVT_${this.type}_${exports.Base58.encodeRipemd160Check(this.data, this.type)}`;
    }
    toJSON() {
        return this.toString();
    }
}
/** @internal */
function decodeKey(value) {
    const type = typeof value;
    if (type !== 'string') {
        throw new Error(`Expected string, got ${type}`);
    }
    if (value.startsWith('PVT_')) {
        // Antelope/EOSIO format
        const parts = value.split('_');
        if (parts.length !== 3) {
            throw new Error('Invalid PVT format');
        }
        const type = exports.KeyType.from(parts[1]);
        let size;
        switch (type) {
            case exports.KeyType.K1:
            case exports.KeyType.R1:
            case exports.KeyType.EM:
                size = 32;
                break;
        }
        const data = exports.Base58.decodeRipemd160Check(parts[2], size, type);
        return { type, data };
    }
    else {
        // WIF format
        const type = exports.KeyType.K1;
        const data = exports.Base58.decodeCheck(value);
        if (data.array[0] !== 0x80) {
            throw new Error('Invalid WIF');
        }
        return { type, data: data.droppingFirst() };
    }
}

var PermissionLevel_1;
/** Antelope/EOSIO Permission Level, a.k.a "auth". */
exports.PermissionLevel = PermissionLevel_1 = class PermissionLevel extends Struct {
    /** Create new permission level from representing types. Can be expressed as a string in the format `<actor>@<permission>`. */
    static from(value) {
        if (typeof value === 'string') {
            const parts = value.split('@');
            if (parts.length !== 2 && parts[0].length > 0 && parts[1].length > 0) {
                throw new Error('Invalid permission level string, should be in the format <actor>@<permission>');
            }
            value = { actor: parts[0], permission: parts[1] };
        }
        return super.from(value);
    }
    /** Return true if this permission level equals other. */
    equals(other) {
        const otherPerm = PermissionLevel_1.from(other);
        return this.actor.equals(otherPerm.actor) && this.permission.equals(otherPerm.permission);
    }
    toString() {
        return `${this.actor}@${this.permission}`;
    }
};
tslib.__decorate([
    Struct.field('name')
], exports.PermissionLevel.prototype, "actor", void 0);
tslib.__decorate([
    Struct.field('name')
], exports.PermissionLevel.prototype, "permission", void 0);
exports.PermissionLevel = PermissionLevel_1 = tslib.__decorate([
    Struct.type('permission_level')
], exports.PermissionLevel);

var Action_1;
exports.Action = Action_1 = class Action extends Struct {
    static from(anyAction, abi) {
        let object = Object.assign({}, anyAction);
        const data = object.data;
        if (!Bytes.isBytes(data)) {
            let type;
            if (abi) {
                type = ABI.from(abi).getActionType(object.name);
            }
            else if (!data.constructor || data.constructor.abiName === undefined) {
                throw new Error('Missing ABI definition when creating action with untyped action data');
            }
            object = Object.assign(Object.assign({}, object), { data: abiEncode({ object: data, type, abi }) });
        }
        const action = super.from(object);
        if (abi) {
            action.abi = ABI.from(abi);
        }
        else {
            const type = getType(data);
            if (type) {
                action.abi = ABI.from(Object.assign(Object.assign({}, synthesizeABI(type).abi), { actions: [
                        {
                            name: action.name,
                            type: type.abiName,
                            ricardian_contract: '',
                        },
                    ] }));
            }
        }
        return action;
    }
    /** Return true if this Action is equal to given action. */
    equals(other) {
        const otherAction = Action_1.from(other, this.abi);
        return (this.account.equals(otherAction.account) &&
            this.name.equals(otherAction.name) &&
            arrayEquatableEquals(this.authorization, otherAction.authorization) &&
            this.data.equals(otherAction.data));
    }
    decodeData(typeOrAbi) {
        if (typeof typeOrAbi === 'string' || typeOrAbi.abiName) {
            return abiDecode({
                data: this.data,
                type: typeOrAbi,
            });
        }
        else {
            const abi = ABI.from(typeOrAbi);
            const type = abi.getActionType(this.name);
            if (!type) {
                throw new Error(`Action ${this.name} does not exist in provided ABI`);
            }
            return abiDecode({ data: this.data, type, abi });
        }
    }
    get decoded() {
        if (!this.abi) {
            throw new Error('Missing ABI definition when decoding action data');
        }
        return Object.assign(Object.assign({}, this.toJSON()), { data: this.decodeData(this.abi) });
    }
};
tslib.__decorate([
    Struct.field('name')
], exports.Action.prototype, "account", void 0);
tslib.__decorate([
    Struct.field('name')
], exports.Action.prototype, "name", void 0);
tslib.__decorate([
    Struct.field(exports.PermissionLevel, { array: true })
], exports.Action.prototype, "authorization", void 0);
tslib.__decorate([
    Struct.field('bytes')
], exports.Action.prototype, "data", void 0);
exports.Action = Action_1 = tslib.__decorate([
    Struct.type('action')
], exports.Action);

var Transaction_1;
exports.TransactionExtension = class TransactionExtension extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], exports.TransactionExtension.prototype, "type", void 0);
tslib.__decorate([
    Struct.field('bytes')
], exports.TransactionExtension.prototype, "data", void 0);
exports.TransactionExtension = tslib.__decorate([
    Struct.type('transaction_extension')
], exports.TransactionExtension);
exports.TransactionHeader = class TransactionHeader extends Struct {
    static from(object) {
        return super.from(Object.assign({ max_net_usage_words: 0, max_cpu_usage_ms: 0, delay_sec: 0 }, object));
    }
};
tslib.__decorate([
    Struct.field('time_point_sec')
], exports.TransactionHeader.prototype, "expiration", void 0);
tslib.__decorate([
    Struct.field('uint16')
], exports.TransactionHeader.prototype, "ref_block_num", void 0);
tslib.__decorate([
    Struct.field('uint32')
], exports.TransactionHeader.prototype, "ref_block_prefix", void 0);
tslib.__decorate([
    Struct.field('varuint32')
], exports.TransactionHeader.prototype, "max_net_usage_words", void 0);
tslib.__decorate([
    Struct.field('uint8')
], exports.TransactionHeader.prototype, "max_cpu_usage_ms", void 0);
tslib.__decorate([
    Struct.field('varuint32')
], exports.TransactionHeader.prototype, "delay_sec", void 0);
exports.TransactionHeader = tslib.__decorate([
    Struct.type('transaction_header')
], exports.TransactionHeader);
exports.Transaction = Transaction_1 = class Transaction extends exports.TransactionHeader {
    static from(object, abis) {
        const abiFor = (contract) => {
            if (!abis) {
                return;
            }
            else if (Array.isArray(abis)) {
                return abis
                    .filter((abi) => Name.from(abi.contract).equals(contract))
                    .map(({ abi }) => abi)[0];
            }
            else {
                return abis;
            }
        };
        const resolveAction = (action) => {
            if (action instanceof exports.Action) {
                return action;
            }
            else {
                return exports.Action.from(action, abiFor(action.account));
            }
        };
        const actions = (object.actions || []).map(resolveAction);
        const context_free_actions = (object.context_free_actions || []).map(resolveAction);
        const transaction = Object.assign(Object.assign({ transaction_extensions: [] }, object), { context_free_actions,
            actions });
        return super.from(transaction);
    }
    /** Return true if this transaction is equal to given transaction. */
    equals(other) {
        const tx = Transaction_1.from(other);
        return this.id.equals(tx.id);
    }
    get id() {
        return Checksum256.hash(abiEncode({ object: this }));
    }
    signingDigest(chainId) {
        const data = this.signingData(chainId);
        return Checksum256.hash(data);
    }
    signingData(chainId) {
        let data = Bytes.from(Checksum256.from(chainId).array);
        data = data.appending(abiEncode({ object: this }));
        data = data.appending(new Uint8Array(32));
        return data;
    }
};
tslib.__decorate([
    Struct.field(exports.Action, { array: true })
], exports.Transaction.prototype, "context_free_actions", void 0);
tslib.__decorate([
    Struct.field(exports.Action, { array: true })
], exports.Transaction.prototype, "actions", void 0);
tslib.__decorate([
    Struct.field(exports.TransactionExtension, { array: true })
], exports.Transaction.prototype, "transaction_extensions", void 0);
exports.Transaction = Transaction_1 = tslib.__decorate([
    Struct.type('transaction')
], exports.Transaction);
exports.SignedTransaction = class SignedTransaction extends exports.Transaction {
    /** The transaction without the signatures. */
    get transaction() {
        return exports.Transaction.from(Object.assign(Object.assign({}, this), { signatures: undefined, context_free_data: undefined }));
    }
    get id() {
        return this.transaction.id;
    }
    static from(object) {
        return super.from(Object.assign({ signatures: [], context_free_data: [] }, object));
    }
};
tslib.__decorate([
    Struct.field('signature[]')
], exports.SignedTransaction.prototype, "signatures", void 0);
tslib.__decorate([
    Struct.field('bytes[]')
], exports.SignedTransaction.prototype, "context_free_data", void 0);
exports.SignedTransaction = tslib.__decorate([
    Struct.type('signed_transaction')
], exports.SignedTransaction);
// reference: https://github.com/AntelopeIO/leap/blob/339d98eed107b9fd94736988996082c7002fa52a/libraries/chain/include/eosio/chain/transaction.hpp#L131-L134
exports.CompressionType = void 0;
(function (CompressionType) {
    CompressionType[CompressionType["none"] = 0] = "none";
    CompressionType[CompressionType["zlib"] = 1] = "zlib";
})(exports.CompressionType || (exports.CompressionType = {}));
exports.PackedTransaction = class PackedTransaction extends Struct {
    static from(object) {
        return super.from(Object.assign({ signatures: [], packed_context_free_data: '', compression: 0 }, object));
    }
    static fromSigned(signed, compression = 1) {
        // Encode data
        let packed_trx = abiEncode({ object: exports.Transaction.from(signed) });
        let packed_context_free_data = abiEncode({
            object: signed.context_free_data,
            type: 'bytes[]',
        });
        switch (compression) {
            case exports.CompressionType.zlib: {
                // compress data
                packed_trx = pako.deflate(packed_trx.array);
                packed_context_free_data = pako.deflate(packed_context_free_data.array);
                break;
            }
            case exports.CompressionType.none: {
                break;
            }
        }
        return this.from({
            compression,
            signatures: signed.signatures,
            packed_context_free_data,
            packed_trx,
        });
    }
    getTransaction() {
        switch (Number(this.compression)) {
            // none
            case exports.CompressionType.none: {
                return abiDecode({ data: this.packed_trx, type: exports.Transaction });
            }
            // zlib compressed
            case exports.CompressionType.zlib: {
                const inflated = pako.inflate(this.packed_trx.array);
                return abiDecode({ data: inflated, type: exports.Transaction });
            }
            default: {
                throw new Error(`Unknown transaction compression ${this.compression}`);
            }
        }
    }
    getSignedTransaction() {
        const transaction = this.getTransaction();
        // TODO: decode context free data
        return exports.SignedTransaction.from(Object.assign(Object.assign({}, transaction), { signatures: this.signatures }));
    }
};
tslib.__decorate([
    Struct.field('signature[]')
], exports.PackedTransaction.prototype, "signatures", void 0);
tslib.__decorate([
    Struct.field('uint8')
], exports.PackedTransaction.prototype, "compression", void 0);
tslib.__decorate([
    Struct.field('bytes')
], exports.PackedTransaction.prototype, "packed_context_free_data", void 0);
tslib.__decorate([
    Struct.field('bytes')
], exports.PackedTransaction.prototype, "packed_trx", void 0);
exports.PackedTransaction = tslib.__decorate([
    Struct.type('packed_transaction')
], exports.PackedTransaction);
exports.TransactionReceipt = class TransactionReceipt extends Struct {
};
tslib.__decorate([
    Struct.field('string')
], exports.TransactionReceipt.prototype, "status", void 0);
tslib.__decorate([
    Struct.field('uint32')
], exports.TransactionReceipt.prototype, "cpu_usage_us", void 0);
tslib.__decorate([
    Struct.field('uint32')
], exports.TransactionReceipt.prototype, "net_usage_words", void 0);
exports.TransactionReceipt = tslib.__decorate([
    Struct.type('transaction_receipt')
], exports.TransactionReceipt);

var Authority_1;
exports.Weight = class Weight extends UInt16 {
};
exports.Weight = tslib.__decorate([
    TypeAlias('weight_type')
], exports.Weight);
exports.KeyWeight = class KeyWeight extends Struct {
};
tslib.__decorate([
    Struct.field(PublicKey)
], exports.KeyWeight.prototype, "key", void 0);
tslib.__decorate([
    Struct.field(exports.Weight)
], exports.KeyWeight.prototype, "weight", void 0);
exports.KeyWeight = tslib.__decorate([
    Struct.type('key_weight')
], exports.KeyWeight);
exports.PermissionLevelWeight = class PermissionLevelWeight extends Struct {
};
tslib.__decorate([
    Struct.field(exports.PermissionLevel)
], exports.PermissionLevelWeight.prototype, "permission", void 0);
tslib.__decorate([
    Struct.field(exports.Weight)
], exports.PermissionLevelWeight.prototype, "weight", void 0);
exports.PermissionLevelWeight = tslib.__decorate([
    Struct.type('permission_level_weight')
], exports.PermissionLevelWeight);
exports.WaitWeight = class WaitWeight extends Struct {
};
tslib.__decorate([
    Struct.field(UInt32)
], exports.WaitWeight.prototype, "wait_sec", void 0);
tslib.__decorate([
    Struct.field(exports.Weight)
], exports.WaitWeight.prototype, "weight", void 0);
exports.WaitWeight = tslib.__decorate([
    Struct.type('wait_weight')
], exports.WaitWeight);
exports.Authority = Authority_1 = class Authority extends Struct {
    static from(value) {
        if (isInstanceOf(value, Authority_1)) {
            return value;
        }
        const rv = super.from(Object.assign({ keys: [], accounts: [], waits: [] }, value));
        rv.sort();
        return rv;
    }
    /** Total weight of all waits. */
    get waitThreshold() {
        return this.waits.reduce((val, wait) => val + wait.weight.toNumber(), 0);
    }
    /** Weight a key needs to sign for this authority. */
    get keyThreshold() {
        return this.threshold.toNumber() - this.waitThreshold;
    }
    /** Return the weight for given public key, or zero if it is not included in this authority. */
    keyWeight(publicKey) {
        const weight = this.keys.find(({ key }) => key.equals(publicKey));
        return weight ? weight.weight.toNumber() : 0;
    }
    /**
     * Check if given public key has permission in this authority,
     * @attention Does not take indirect permissions for the key via account weights into account.
     * @param publicKey The key to check.
     * @param includePartial Whether to consider auths where the key is included but can't be reached alone (e.g. multisig).
     */
    hasPermission(publicKey, includePartial = false) {
        const threshold = includePartial ? 1 : this.keyThreshold;
        const weight = this.keyWeight(publicKey);
        return weight >= threshold;
    }
    /**
     * Sorts the authority weights in place, should be called before including the authority in a `updateauth` action or it might be rejected.
     */
    sort() {
        // This hack satisfies the constraints that authority weights, see: https://github.com/wharfkit/antelope/issues/8
        this.keys.sort((a, b) => String(a.key).localeCompare(String(b.key)));
        this.accounts.sort((a, b) => String(a.permission).localeCompare(String(b.permission)));
        this.waits.sort((a, b) => String(a.wait_sec).localeCompare(String(b.wait_sec)));
    }
};
tslib.__decorate([
    Struct.field(UInt32)
], exports.Authority.prototype, "threshold", void 0);
tslib.__decorate([
    Struct.field(exports.KeyWeight, { array: true })
], exports.Authority.prototype, "keys", void 0);
tslib.__decorate([
    Struct.field(exports.PermissionLevelWeight, { array: true })
], exports.Authority.prototype, "accounts", void 0);
tslib.__decorate([
    Struct.field(exports.WaitWeight, { array: true })
], exports.Authority.prototype, "waits", void 0);
exports.Authority = Authority_1 = tslib.__decorate([
    Struct.type('authority')
], exports.Authority);

class BlockId {
    static from(value) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (Bytes.isBytes(value)) {
            return new this(Bytes.from(value).array);
        }
        else {
            return this.fromBlockChecksum(value.checksum, value.blockNum);
        }
    }
    static fromABI(decoder) {
        return new this(decoder.readArray(32));
    }
    static fromBlockChecksum(checksum, blockNum) {
        const id = new BlockId(Checksum256.from(checksum).array);
        const numBuffer = new Uint8Array(4);
        numBuffer[0] = (Number(blockNum) >> 24) & 0xff;
        numBuffer[1] = (Number(blockNum) >> 16) & 0xff;
        numBuffer[2] = (Number(blockNum) >> 8) & 0xff;
        numBuffer[3] = Number(blockNum) & 0xff;
        id.array.set(numBuffer, 0);
        return id;
    }
    constructor(array) {
        if (array.byteLength !== 32) {
            throw new Error(`BlockId size mismatch, expected 32 bytes got ${array.byteLength}`);
        }
        this.array = array;
    }
    equals(other) {
        const self = this.constructor;
        try {
            return arrayEquals(this.array, self.from(other).array);
        }
        catch (_a) {
            return false;
        }
    }
    toABI(encoder) {
        encoder.writeArray(this.array);
    }
    toString() {
        return this.hexString;
    }
    toJSON() {
        return this.toString();
    }
    get hexString() {
        return arrayToHex(this.array);
    }
    get blockNum() {
        const bytes = this.array.slice(0, 4);
        let num = 0;
        for (let i = 0; i < 4; i++) {
            num = (num << 8) + bytes[i];
        }
        return UInt32.from(num);
    }
}
BlockId.abiName = 'block_id_type'; // eosio contract context defines this with a _type suffix for some reason

exports.Serializer = void 0;
(function (Serializer) {
    Serializer.encode = abiEncode;
    Serializer.decode = abiDecode;
    /** Create an Antelope/EOSIO ABI definition for given core type. */
    function synthesize(type) {
        return synthesizeABI(type).abi;
    }
    Serializer.synthesize = synthesize;
    /** Create JSON representation of a core object. */
    function stringify(object) {
        return JSON.stringify(object);
    }
    Serializer.stringify = stringify;
    /** Create a vanilla js representation of a core object. */
    function objectify(object) {
        const walk = (v) => {
            switch (typeof v) {
                case 'boolean':
                case 'number':
                case 'string':
                    return v;
                case 'object': {
                    if (v === null) {
                        return v;
                    }
                    if (typeof v.toJSON === 'function') {
                        return walk(v.toJSON());
                    }
                    if (Array.isArray(v)) {
                        return v.map(walk);
                    }
                    const rv = {};
                    for (const key of Object.keys(v)) {
                        rv[key] = walk(v[key]);
                    }
                    return rv;
                }
            }
        };
        return walk(object);
    }
    Serializer.objectify = objectify;
})(exports.Serializer || (exports.Serializer = {}));

/** Default provider that uses the Fetch API to call a single node. */
class FetchProvider {
    constructor(url, options = {}) {
        this.headers = {};
        url = url.trim();
        if (url.endsWith('/'))
            url = url.slice(0, -1);
        this.url = url;
        if (options.headers) {
            this.headers = options.headers;
        }
        if (!options.fetch) {
            if (typeof window !== 'undefined' && window.fetch) {
                this.fetch = window.fetch.bind(window);
            }
            else if (typeof global !== 'undefined' && global.fetch) {
                this.fetch = global.fetch.bind(global);
            }
            else {
                throw new Error('Missing fetch');
            }
        }
        else {
            this.fetch = options.fetch;
        }
    }
    call(args) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const url = this.url + args.path;
            const reqBody = args.params !== undefined ? JSON.stringify(args.params) : undefined;
            const reqHeaders = Object.assign(Object.assign({}, this.headers), args.headers);
            const response = yield this.fetch(url, {
                method: args.method || 'POST',
                body: reqBody,
                headers: reqHeaders,
            });
            const text = yield response.text();
            let json;
            try {
                json = JSON.parse(text);
            }
            catch (_a) {
                // ignore json parse errors
            }
            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key] = value;
            }
            return { headers, status: response.status, json, text };
        });
    }
}

let AccountLinkedAction = class AccountLinkedAction extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountLinkedAction.prototype, "account", void 0);
tslib.__decorate([
    Struct.field('name', { optional: true })
], AccountLinkedAction.prototype, "action", void 0);
AccountLinkedAction = tslib.__decorate([
    Struct.type('account_linked_action')
], AccountLinkedAction);
let AccountPermission = class AccountPermission extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountPermission.prototype, "perm_name", void 0);
tslib.__decorate([
    Struct.field('name')
], AccountPermission.prototype, "parent", void 0);
tslib.__decorate([
    Struct.field(exports.Authority)
], AccountPermission.prototype, "required_auth", void 0);
tslib.__decorate([
    Struct.field(AccountLinkedAction, { optional: true, array: true })
], AccountPermission.prototype, "linked_actions", void 0);
AccountPermission = tslib.__decorate([
    Struct.type('account_permission')
], AccountPermission);
let AccountResourceLimit = class AccountResourceLimit extends Struct {
};
tslib.__decorate([
    Struct.field('int64')
], AccountResourceLimit.prototype, "used", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountResourceLimit.prototype, "available", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountResourceLimit.prototype, "max", void 0);
tslib.__decorate([
    Struct.field('time_point', { optional: true })
], AccountResourceLimit.prototype, "last_usage_update_time", void 0);
tslib.__decorate([
    Struct.field('int64', { optional: true })
], AccountResourceLimit.prototype, "current_used", void 0);
AccountResourceLimit = tslib.__decorate([
    Struct.type('account_resource_limit')
], AccountResourceLimit);
let AccountTotalResources = class AccountTotalResources extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountTotalResources.prototype, "owner", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountTotalResources.prototype, "net_weight", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountTotalResources.prototype, "cpu_weight", void 0);
tslib.__decorate([
    Struct.field('uint64')
], AccountTotalResources.prototype, "ram_bytes", void 0);
AccountTotalResources = tslib.__decorate([
    Struct.type('account_total_resources')
], AccountTotalResources);
let AccountSelfDelegatedBandwidth = class AccountSelfDelegatedBandwidth extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountSelfDelegatedBandwidth.prototype, "from", void 0);
tslib.__decorate([
    Struct.field('name')
], AccountSelfDelegatedBandwidth.prototype, "to", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountSelfDelegatedBandwidth.prototype, "net_weight", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountSelfDelegatedBandwidth.prototype, "cpu_weight", void 0);
AccountSelfDelegatedBandwidth = tslib.__decorate([
    Struct.type('account_self_delegated_bandwidth')
], AccountSelfDelegatedBandwidth);
let AccountRefundRequest = class AccountRefundRequest extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountRefundRequest.prototype, "owner", void 0);
tslib.__decorate([
    Struct.field('time_point')
], AccountRefundRequest.prototype, "request_time", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountRefundRequest.prototype, "net_amount", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountRefundRequest.prototype, "cpu_amount", void 0);
AccountRefundRequest = tslib.__decorate([
    Struct.type('account_refund_request')
], AccountRefundRequest);
let AccountVoterInfo = class AccountVoterInfo extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], AccountVoterInfo.prototype, "owner", void 0);
tslib.__decorate([
    Struct.field('name')
], AccountVoterInfo.prototype, "proxy", void 0);
tslib.__decorate([
    Struct.field('name', { array: true })
], AccountVoterInfo.prototype, "producers", void 0);
tslib.__decorate([
    Struct.field('int64', { optional: true })
], AccountVoterInfo.prototype, "staked", void 0);
tslib.__decorate([
    Struct.field('float64')
], AccountVoterInfo.prototype, "last_vote_weight", void 0);
tslib.__decorate([
    Struct.field('float64')
], AccountVoterInfo.prototype, "proxied_vote_weight", void 0);
tslib.__decorate([
    Struct.field('bool')
], AccountVoterInfo.prototype, "is_proxy", void 0);
tslib.__decorate([
    Struct.field('uint32', { optional: true })
], AccountVoterInfo.prototype, "flags1", void 0);
tslib.__decorate([
    Struct.field('uint32')
], AccountVoterInfo.prototype, "reserved2", void 0);
tslib.__decorate([
    Struct.field('string')
], AccountVoterInfo.prototype, "reserved3", void 0);
AccountVoterInfo = tslib.__decorate([
    Struct.type('account_voter_info')
], AccountVoterInfo);
let AccountRexInfoMaturities = class AccountRexInfoMaturities extends Struct {
};
tslib.__decorate([
    Struct.field('time_point', { optional: true })
], AccountRexInfoMaturities.prototype, "key", void 0);
tslib.__decorate([
    Struct.field('int64', { optional: true })
], AccountRexInfoMaturities.prototype, "value", void 0);
tslib.__decorate([
    Struct.field('time_point', { optional: true })
], AccountRexInfoMaturities.prototype, "first", void 0);
tslib.__decorate([
    Struct.field('int64', { optional: true })
], AccountRexInfoMaturities.prototype, "second", void 0);
AccountRexInfoMaturities = tslib.__decorate([
    Struct.type('account_rex_info_maturities')
], AccountRexInfoMaturities);
let AccountRexInfo = class AccountRexInfo extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], AccountRexInfo.prototype, "version", void 0);
tslib.__decorate([
    Struct.field('name')
], AccountRexInfo.prototype, "owner", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountRexInfo.prototype, "vote_stake", void 0);
tslib.__decorate([
    Struct.field('asset')
], AccountRexInfo.prototype, "rex_balance", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountRexInfo.prototype, "matured_rex", void 0);
tslib.__decorate([
    Struct.field(AccountRexInfoMaturities, { array: true })
], AccountRexInfo.prototype, "rex_maturities", void 0);
AccountRexInfo = tslib.__decorate([
    Struct.type('account_rex_info')
], AccountRexInfo);
let GetRawAbiResponse = class GetRawAbiResponse extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], GetRawAbiResponse.prototype, "account_name", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetRawAbiResponse.prototype, "code_hash", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetRawAbiResponse.prototype, "abi_hash", void 0);
tslib.__decorate([
    Struct.field(Blob)
], GetRawAbiResponse.prototype, "abi", void 0);
GetRawAbiResponse = tslib.__decorate([
    Struct.type('get_raw_abi_response')
], GetRawAbiResponse);
let AccountObject = class AccountObject extends Struct {
    getPermission(permission) {
        const name = Name.from(permission);
        const match = this.permissions.find((p) => p.perm_name.equals(name));
        if (!match) {
            throw new Error(`Unknown permission ${name} on account ${this.account_name}.`);
        }
        return match;
    }
};
tslib.__decorate([
    Struct.field('name')
], AccountObject.prototype, "account_name", void 0);
tslib.__decorate([
    Struct.field('uint32')
], AccountObject.prototype, "head_block_num", void 0);
tslib.__decorate([
    Struct.field('time_point')
], AccountObject.prototype, "head_block_time", void 0);
tslib.__decorate([
    Struct.field('bool')
], AccountObject.prototype, "privileged", void 0);
tslib.__decorate([
    Struct.field('time_point')
], AccountObject.prototype, "last_code_update", void 0);
tslib.__decorate([
    Struct.field('time_point')
], AccountObject.prototype, "created", void 0);
tslib.__decorate([
    Struct.field('asset?')
], AccountObject.prototype, "core_liquid_balance", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountObject.prototype, "ram_quota", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountObject.prototype, "net_weight", void 0);
tslib.__decorate([
    Struct.field('int64')
], AccountObject.prototype, "cpu_weight", void 0);
tslib.__decorate([
    Struct.field(AccountResourceLimit)
], AccountObject.prototype, "net_limit", void 0);
tslib.__decorate([
    Struct.field(AccountResourceLimit)
], AccountObject.prototype, "cpu_limit", void 0);
tslib.__decorate([
    Struct.field(AccountResourceLimit, { optional: true })
], AccountObject.prototype, "subjective_cpu_bill_limit", void 0);
tslib.__decorate([
    Struct.field('uint64')
], AccountObject.prototype, "ram_usage", void 0);
tslib.__decorate([
    Struct.field(AccountPermission, { array: true })
], AccountObject.prototype, "permissions", void 0);
tslib.__decorate([
    Struct.field(AccountTotalResources, { optional: true })
], AccountObject.prototype, "total_resources", void 0);
tslib.__decorate([
    Struct.field(AccountSelfDelegatedBandwidth, { optional: true })
], AccountObject.prototype, "self_delegated_bandwidth", void 0);
tslib.__decorate([
    Struct.field(AccountRefundRequest, { optional: true })
], AccountObject.prototype, "refund_request", void 0);
tslib.__decorate([
    Struct.field(AccountVoterInfo, { optional: true })
], AccountObject.prototype, "voter_info", void 0);
tslib.__decorate([
    Struct.field(AccountRexInfo, { optional: true })
], AccountObject.prototype, "rex_info", void 0);
AccountObject = tslib.__decorate([
    Struct.type('account_object')
], AccountObject);
let AccountByAuthorizersRow = class AccountByAuthorizersRow extends Struct {
};
tslib.__decorate([
    Struct.field(Name)
], AccountByAuthorizersRow.prototype, "account_name", void 0);
tslib.__decorate([
    Struct.field(Name)
], AccountByAuthorizersRow.prototype, "permission_name", void 0);
tslib.__decorate([
    Struct.field(PublicKey, { optional: true })
], AccountByAuthorizersRow.prototype, "authorizing_key", void 0);
tslib.__decorate([
    Struct.field(exports.PermissionLevel, { optional: true })
], AccountByAuthorizersRow.prototype, "authorizing_account", void 0);
tslib.__decorate([
    Struct.field(exports.Weight)
], AccountByAuthorizersRow.prototype, "weight", void 0);
tslib.__decorate([
    Struct.field(UInt32)
], AccountByAuthorizersRow.prototype, "threshold", void 0);
AccountByAuthorizersRow = tslib.__decorate([
    Struct.type('account_by_authorizers_row')
], AccountByAuthorizersRow);
let AccountsByAuthorizers = class AccountsByAuthorizers extends Struct {
};
tslib.__decorate([
    Struct.field(AccountByAuthorizersRow, { array: true })
], AccountsByAuthorizers.prototype, "accounts", void 0);
AccountsByAuthorizers = tslib.__decorate([
    Struct.type('account_by_authorizers')
], AccountsByAuthorizers);
let NewProducersEntry$1 = class NewProducersEntry extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], NewProducersEntry$1.prototype, "producer_name", void 0);
tslib.__decorate([
    Struct.field('public_key')
], NewProducersEntry$1.prototype, "block_signing_key", void 0);
NewProducersEntry$1 = tslib.__decorate([
    Struct.type('new_producers_entry')
], NewProducersEntry$1);
let NewProducers$1 = class NewProducers extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], NewProducers$1.prototype, "version", void 0);
tslib.__decorate([
    Struct.field(NewProducersEntry$1, { array: true })
], NewProducers$1.prototype, "producers", void 0);
NewProducers$1 = tslib.__decorate([
    Struct.type('new_producers')
], NewProducers$1);
let BlockExtension$1 = class BlockExtension extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], BlockExtension$1.prototype, "type", void 0);
tslib.__decorate([
    Struct.field('bytes')
], BlockExtension$1.prototype, "data", void 0);
BlockExtension$1 = tslib.__decorate([
    Struct.type('block_extension')
], BlockExtension$1);
let HeaderExtension$1 = class HeaderExtension extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], HeaderExtension$1.prototype, "type", void 0);
tslib.__decorate([
    Struct.field('bytes')
], HeaderExtension$1.prototype, "data", void 0);
HeaderExtension$1 = tslib.__decorate([
    Struct.type('header_extension')
], HeaderExtension$1);
// fc "mutable variant" returned by get_block api
let TrxVariant$1 = class TrxVariant {
    static from(data) {
        let id;
        let extra;
        if (typeof data === 'string') {
            id = Checksum256.from(data);
            extra = {};
        }
        else {
            id = Checksum256.from(data.id);
            extra = data;
        }
        return new this(id, extra);
    }
    constructor(id, extra) {
        this.id = id;
        this.extra = extra;
    }
    get transaction() {
        if (this.extra.packed_trx) {
            switch (this.extra.compression) {
                case 'zlib': {
                    const inflated = pako.inflate(Bytes.from(this.extra.packed_trx, 'hex').array);
                    return exports.Serializer.decode({ data: inflated, type: exports.Transaction });
                }
                case 'none': {
                    return exports.Serializer.decode({ data: this.extra.packed_trx, type: exports.Transaction });
                }
                default: {
                    throw new Error(`Unsupported compression type ${this.extra.compression}`);
                }
            }
        }
    }
    get signatures() {
        if (this.extra.signatures) {
            return this.extra.signatures.map(Signature.from);
        }
    }
    equals(other) {
        return this.id.equals(other.id);
    }
    toJSON() {
        return this.id;
    }
};
TrxVariant$1.abiName = 'trx_variant';
let GetBlockResponseTransactionReceipt = class GetBlockResponseTransactionReceipt extends exports.TransactionReceipt {
    get id() {
        return this.trx.id;
    }
};
tslib.__decorate([
    Struct.field(TrxVariant$1)
], GetBlockResponseTransactionReceipt.prototype, "trx", void 0);
GetBlockResponseTransactionReceipt = tslib.__decorate([
    Struct.type('get_block_response_receipt')
], GetBlockResponseTransactionReceipt);
let GetBlockResponse = class GetBlockResponse extends Struct {
};
tslib.__decorate([
    Struct.field('time_point')
], GetBlockResponse.prototype, "timestamp", void 0);
tslib.__decorate([
    Struct.field('name')
], GetBlockResponse.prototype, "producer", void 0);
tslib.__decorate([
    Struct.field('uint16')
], GetBlockResponse.prototype, "confirmed", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetBlockResponse.prototype, "previous", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetBlockResponse.prototype, "transaction_mroot", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetBlockResponse.prototype, "action_mroot", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockResponse.prototype, "schedule_version", void 0);
tslib.__decorate([
    Struct.field(NewProducers$1, { optional: true })
], GetBlockResponse.prototype, "new_producers", void 0);
tslib.__decorate([
    Struct.field('header_extension', { optional: true })
], GetBlockResponse.prototype, "header_extensions", void 0);
tslib.__decorate([
    Struct.field('any', { optional: true })
], GetBlockResponse.prototype, "new_protocol_features", void 0);
tslib.__decorate([
    Struct.field('signature')
], GetBlockResponse.prototype, "producer_signature", void 0);
tslib.__decorate([
    Struct.field(GetBlockResponseTransactionReceipt, { array: true })
], GetBlockResponse.prototype, "transactions", void 0);
tslib.__decorate([
    Struct.field('block_extension', { optional: true })
], GetBlockResponse.prototype, "block_extensions", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetBlockResponse.prototype, "id", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockResponse.prototype, "block_num", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockResponse.prototype, "ref_block_prefix", void 0);
GetBlockResponse = tslib.__decorate([
    Struct.type('get_block_response')
], GetBlockResponse);
let GetBlockInfoResponse = class GetBlockInfoResponse extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], GetBlockInfoResponse.prototype, "block_num", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockInfoResponse.prototype, "ref_block_num", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetBlockInfoResponse.prototype, "id", void 0);
tslib.__decorate([
    Struct.field('time_point')
], GetBlockInfoResponse.prototype, "timestamp", void 0);
tslib.__decorate([
    Struct.field('name')
], GetBlockInfoResponse.prototype, "producer", void 0);
tslib.__decorate([
    Struct.field('uint16')
], GetBlockInfoResponse.prototype, "confirmed", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetBlockInfoResponse.prototype, "previous", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetBlockInfoResponse.prototype, "transaction_mroot", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetBlockInfoResponse.prototype, "action_mroot", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockInfoResponse.prototype, "schedule_version", void 0);
tslib.__decorate([
    Struct.field('signature')
], GetBlockInfoResponse.prototype, "producer_signature", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockInfoResponse.prototype, "ref_block_prefix", void 0);
GetBlockInfoResponse = tslib.__decorate([
    Struct.type('get_block_response')
], GetBlockInfoResponse);
let ActiveScheduleProducerAuthority = class ActiveScheduleProducerAuthority extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], ActiveScheduleProducerAuthority.prototype, "producer_name", void 0);
tslib.__decorate([
    Struct.field('any')
], ActiveScheduleProducerAuthority.prototype, "authority", void 0);
ActiveScheduleProducerAuthority = tslib.__decorate([
    Struct.type('active_schedule_producer_authority')
], ActiveScheduleProducerAuthority);
let ActiveScheduleProducer = class ActiveScheduleProducer extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], ActiveScheduleProducer.prototype, "producer_name", void 0);
tslib.__decorate([
    Struct.field(ActiveScheduleProducerAuthority)
], ActiveScheduleProducer.prototype, "authority", void 0);
ActiveScheduleProducer = tslib.__decorate([
    Struct.type('active_schedule_producer')
], ActiveScheduleProducer);
let ActiveSchedule = class ActiveSchedule extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], ActiveSchedule.prototype, "version", void 0);
tslib.__decorate([
    Struct.field(ActiveScheduleProducer, { array: true })
], ActiveSchedule.prototype, "producers", void 0);
ActiveSchedule = tslib.__decorate([
    Struct.type('active_schedule')
], ActiveSchedule);
let BlockStateHeader = class BlockStateHeader extends Struct {
};
tslib.__decorate([
    Struct.field('time_point')
], BlockStateHeader.prototype, "timestamp", void 0);
tslib.__decorate([
    Struct.field('name')
], BlockStateHeader.prototype, "producer", void 0);
tslib.__decorate([
    Struct.field('uint16')
], BlockStateHeader.prototype, "confirmed", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], BlockStateHeader.prototype, "previous", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], BlockStateHeader.prototype, "transaction_mroot", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], BlockStateHeader.prototype, "action_mroot", void 0);
tslib.__decorate([
    Struct.field('uint32')
], BlockStateHeader.prototype, "schedule_version", void 0);
tslib.__decorate([
    Struct.field(HeaderExtension$1, { array: true, optional: true })
], BlockStateHeader.prototype, "header_extensions", void 0);
tslib.__decorate([
    Struct.field('signature')
], BlockStateHeader.prototype, "producer_signature", void 0);
BlockStateHeader = tslib.__decorate([
    Struct.type('block_state_header')
], BlockStateHeader);
let GetBlockHeaderStateResponse = class GetBlockHeaderStateResponse extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], GetBlockHeaderStateResponse.prototype, "block_num", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockHeaderStateResponse.prototype, "dpos_proposed_irreversible_blocknum", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetBlockHeaderStateResponse.prototype, "dpos_irreversible_blocknum", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetBlockHeaderStateResponse.prototype, "id", void 0);
tslib.__decorate([
    Struct.field(BlockStateHeader)
], GetBlockHeaderStateResponse.prototype, "header", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "active_schedule", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "blockroot_merkle", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "producer_to_last_produced", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "producer_to_last_implied_irb", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "valid_block_signing_authority", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "confirm_count", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "pending_schedule", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "activated_protocol_features", void 0);
tslib.__decorate([
    Struct.field('any')
], GetBlockHeaderStateResponse.prototype, "additional_signatures", void 0);
GetBlockHeaderStateResponse = tslib.__decorate([
    Struct.type('get_block_header_state_response')
], GetBlockHeaderStateResponse);
let GetInfoResponse = class GetInfoResponse extends Struct {
    getTransactionHeader(secondsAhead = 120) {
        const expiration = TimePointSec.fromMilliseconds(this.head_block_time.toMilliseconds() + secondsAhead * 1000);
        const id = this.last_irreversible_block_id;
        const prefixArray = id.array.subarray(8, 12);
        const prefix = new Uint32Array(prefixArray.buffer, prefixArray.byteOffset, 1)[0];
        return exports.TransactionHeader.from({
            expiration,
            ref_block_num: Number(this.last_irreversible_block_num) & 0xffff,
            ref_block_prefix: prefix,
        });
    }
};
tslib.__decorate([
    Struct.field('string')
], GetInfoResponse.prototype, "server_version", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetInfoResponse.prototype, "chain_id", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetInfoResponse.prototype, "head_block_num", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetInfoResponse.prototype, "last_irreversible_block_num", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetInfoResponse.prototype, "last_irreversible_block_id", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetInfoResponse.prototype, "head_block_id", void 0);
tslib.__decorate([
    Struct.field('time_point')
], GetInfoResponse.prototype, "head_block_time", void 0);
tslib.__decorate([
    Struct.field('name')
], GetInfoResponse.prototype, "head_block_producer", void 0);
tslib.__decorate([
    Struct.field('uint64')
], GetInfoResponse.prototype, "virtual_block_cpu_limit", void 0);
tslib.__decorate([
    Struct.field('uint64')
], GetInfoResponse.prototype, "virtual_block_net_limit", void 0);
tslib.__decorate([
    Struct.field('uint64')
], GetInfoResponse.prototype, "block_cpu_limit", void 0);
tslib.__decorate([
    Struct.field('uint64')
], GetInfoResponse.prototype, "block_net_limit", void 0);
tslib.__decorate([
    Struct.field('string?')
], GetInfoResponse.prototype, "server_version_string", void 0);
tslib.__decorate([
    Struct.field('uint32?')
], GetInfoResponse.prototype, "fork_db_head_block_num", void 0);
tslib.__decorate([
    Struct.field('block_id_type?')
], GetInfoResponse.prototype, "fork_db_head_block_id", void 0);
GetInfoResponse = tslib.__decorate([
    Struct.type('get_info_response')
], GetInfoResponse);
let GetTableByScopeResponseRow = class GetTableByScopeResponseRow extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], GetTableByScopeResponseRow.prototype, "code", void 0);
tslib.__decorate([
    Struct.field('name')
], GetTableByScopeResponseRow.prototype, "scope", void 0);
tslib.__decorate([
    Struct.field('name')
], GetTableByScopeResponseRow.prototype, "table", void 0);
tslib.__decorate([
    Struct.field('name')
], GetTableByScopeResponseRow.prototype, "payer", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetTableByScopeResponseRow.prototype, "count", void 0);
GetTableByScopeResponseRow = tslib.__decorate([
    Struct.type('get_table_by_scope_response_row')
], GetTableByScopeResponseRow);
let GetTableByScopeResponse = class GetTableByScopeResponse extends Struct {
};
tslib.__decorate([
    Struct.field(GetTableByScopeResponseRow, { array: true })
], GetTableByScopeResponse.prototype, "rows", void 0);
tslib.__decorate([
    Struct.field('string')
], GetTableByScopeResponse.prototype, "more", void 0);
GetTableByScopeResponse = tslib.__decorate([
    Struct.type('get_table_by_scope_response')
], GetTableByScopeResponse);
let OrderedActionsResult = class OrderedActionsResult extends Struct {
};
tslib.__decorate([
    Struct.field(UInt64)
], OrderedActionsResult.prototype, "global_action_seq", void 0);
tslib.__decorate([
    Struct.field(Int64)
], OrderedActionsResult.prototype, "account_action_seq", void 0);
tslib.__decorate([
    Struct.field(UInt32)
], OrderedActionsResult.prototype, "block_num", void 0);
tslib.__decorate([
    Struct.field(BlockTimestamp)
], OrderedActionsResult.prototype, "block_time", void 0);
tslib.__decorate([
    Struct.field('any')
], OrderedActionsResult.prototype, "action_trace", void 0);
tslib.__decorate([
    Struct.field('boolean?')
], OrderedActionsResult.prototype, "irrevirsible", void 0);
OrderedActionsResult = tslib.__decorate([
    Struct.type('ordered_action_result')
], OrderedActionsResult);
let GetActionsResponse = class GetActionsResponse extends Struct {
};
tslib.__decorate([
    Struct.field(OrderedActionsResult, { array: true })
], GetActionsResponse.prototype, "actions", void 0);
tslib.__decorate([
    Struct.field(Int32)
], GetActionsResponse.prototype, "last_irreversible_block", void 0);
tslib.__decorate([
    Struct.field(Int32)
], GetActionsResponse.prototype, "head_block_num", void 0);
tslib.__decorate([
    Struct.field('boolean?')
], GetActionsResponse.prototype, "time_limit_exceeded_error", void 0);
GetActionsResponse = tslib.__decorate([
    Struct.type('get_actions_response')
], GetActionsResponse);
let TransactionTrace = class TransactionTrace extends Struct {
};
TransactionTrace = tslib.__decorate([
    Struct.type('transaction_trace')
], TransactionTrace);
let Trx = class Trx extends Struct {
};
tslib.__decorate([
    Struct.field('any')
], Trx.prototype, "actions", void 0);
tslib.__decorate([
    Struct.field('any')
], Trx.prototype, "context_free_actions", void 0);
tslib.__decorate([
    Struct.field('any')
], Trx.prototype, "context_free_data", void 0);
tslib.__decorate([
    Struct.field('number')
], Trx.prototype, "delay_sec", void 0);
tslib.__decorate([
    Struct.field('string')
], Trx.prototype, "expiration", void 0);
tslib.__decorate([
    Struct.field('number')
], Trx.prototype, "max_cpu_usage_ms", void 0);
tslib.__decorate([
    Struct.field('number')
], Trx.prototype, "max_net_usage_words", void 0);
tslib.__decorate([
    Struct.field('number')
], Trx.prototype, "ref_block_num", void 0);
tslib.__decorate([
    Struct.field('number')
], Trx.prototype, "ref_block_prefix", void 0);
tslib.__decorate([
    Struct.field('string', { array: true })
], Trx.prototype, "signatures", void 0);
Trx = tslib.__decorate([
    Struct.type('trx')
], Trx);
let TransactionInfo = class TransactionInfo extends Struct {
};
tslib.__decorate([
    Struct.field(exports.TransactionReceipt)
], TransactionInfo.prototype, "receipt", void 0);
tslib.__decorate([
    Struct.field('trx')
], TransactionInfo.prototype, "trx", void 0);
TransactionInfo = tslib.__decorate([
    Struct.type('transaction_info')
], TransactionInfo);
let GetTransactionResponse = class GetTransactionResponse extends Struct {
};
tslib.__decorate([
    Struct.field(Checksum256)
], GetTransactionResponse.prototype, "id", void 0);
tslib.__decorate([
    Struct.field(UInt32)
], GetTransactionResponse.prototype, "block_num", void 0);
tslib.__decorate([
    Struct.field(BlockTimestamp)
], GetTransactionResponse.prototype, "block_time", void 0);
tslib.__decorate([
    Struct.field(UInt32)
], GetTransactionResponse.prototype, "last_irreversible_block", void 0);
tslib.__decorate([
    Struct.field('any?')
], GetTransactionResponse.prototype, "traces", void 0);
tslib.__decorate([
    Struct.field('any')
], GetTransactionResponse.prototype, "trx", void 0);
GetTransactionResponse = tslib.__decorate([
    Struct.type('get_transaction_response')
], GetTransactionResponse);
let GetKeyAccountsResponse = class GetKeyAccountsResponse extends Struct {
};
tslib.__decorate([
    Struct.field('name', { array: true })
], GetKeyAccountsResponse.prototype, "account_names", void 0);
GetKeyAccountsResponse = tslib.__decorate([
    Struct.type('get_key_accounts_response')
], GetKeyAccountsResponse);
let GetCodeResponse = class GetCodeResponse extends Struct {
};
tslib.__decorate([
    Struct.field(ABI)
], GetCodeResponse.prototype, "abi", void 0);
tslib.__decorate([
    Struct.field('name')
], GetCodeResponse.prototype, "account_name", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GetCodeResponse.prototype, "code_hash", void 0);
tslib.__decorate([
    Struct.field('string')
], GetCodeResponse.prototype, "wast", void 0);
tslib.__decorate([
    Struct.field('string')
], GetCodeResponse.prototype, "wasm", void 0);
GetCodeResponse = tslib.__decorate([
    Struct.type('get_code_response')
], GetCodeResponse);
let GetControlledAccountsResponse = class GetControlledAccountsResponse extends Struct {
};
tslib.__decorate([
    Struct.field('name', { array: true })
], GetControlledAccountsResponse.prototype, "controlled_accounts", void 0);
GetControlledAccountsResponse = tslib.__decorate([
    Struct.type('get_controlled_accounts_response')
], GetControlledAccountsResponse);
let GetCurrencyStatsItemResponse = class GetCurrencyStatsItemResponse extends Struct {
};
tslib.__decorate([
    Struct.field('asset')
], GetCurrencyStatsItemResponse.prototype, "supply", void 0);
tslib.__decorate([
    Struct.field('asset')
], GetCurrencyStatsItemResponse.prototype, "max_supply", void 0);
tslib.__decorate([
    Struct.field('name')
], GetCurrencyStatsItemResponse.prototype, "issuer", void 0);
GetCurrencyStatsItemResponse = tslib.__decorate([
    Struct.type('get_currency_stats_item_response')
], GetCurrencyStatsItemResponse);
let GetTransactionStatusResponse = class GetTransactionStatusResponse extends Struct {
};
tslib.__decorate([
    Struct.field('string')
], GetTransactionStatusResponse.prototype, "state", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetTransactionStatusResponse.prototype, "head_number", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetTransactionStatusResponse.prototype, "head_id", void 0);
tslib.__decorate([
    Struct.field('time_point')
], GetTransactionStatusResponse.prototype, "head_timestamp", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetTransactionStatusResponse.prototype, "irreversible_number", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetTransactionStatusResponse.prototype, "irreversible_id", void 0);
tslib.__decorate([
    Struct.field('time_point')
], GetTransactionStatusResponse.prototype, "irreversible_timestamp", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], GetTransactionStatusResponse.prototype, "earliest_tracked_block_id", void 0);
tslib.__decorate([
    Struct.field('uint32')
], GetTransactionStatusResponse.prototype, "earliest_tracked_block_number", void 0);
GetTransactionStatusResponse = tslib.__decorate([
    Struct.type('get_transaction_status_response')
], GetTransactionStatusResponse);
let ProducerAuthority = class ProducerAuthority extends Struct {
};
tslib.__decorate([
    Struct.field(UInt32)
], ProducerAuthority.prototype, "threshold", void 0);
tslib.__decorate([
    Struct.field(exports.KeyWeight, { array: true })
], ProducerAuthority.prototype, "keys", void 0);
ProducerAuthority = tslib.__decorate([
    Struct.type('producer_authority')
], ProducerAuthority);
let Producer = class Producer extends Struct {
    static from(data) {
        return super.from(Object.assign(Object.assign({}, data), { authority: [data.authority[0], ProducerAuthority.from(data.authority[1])] }));
    }
};
tslib.__decorate([
    Struct.field('name')
], Producer.prototype, "producer_name", void 0);
tslib.__decorate([
    Struct.field('any', { array: true })
], Producer.prototype, "authority", void 0);
Producer = tslib.__decorate([
    Struct.type('producer')
], Producer);
let ProducerSchedule = class ProducerSchedule extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], ProducerSchedule.prototype, "version", void 0);
tslib.__decorate([
    Struct.field(Producer, { array: true })
], ProducerSchedule.prototype, "producers", void 0);
ProducerSchedule = tslib.__decorate([
    Struct.type('producer_schedule')
], ProducerSchedule);
let GetProducerScheduleResponse = class GetProducerScheduleResponse extends Struct {
};
tslib.__decorate([
    Struct.field(ProducerSchedule, { optional: true })
], GetProducerScheduleResponse.prototype, "active", void 0);
tslib.__decorate([
    Struct.field(ProducerSchedule, { optional: true })
], GetProducerScheduleResponse.prototype, "pending", void 0);
tslib.__decorate([
    Struct.field(ProducerSchedule, { optional: true })
], GetProducerScheduleResponse.prototype, "proposed", void 0);
GetProducerScheduleResponse = tslib.__decorate([
    Struct.type('get_producer_schedule_response')
], GetProducerScheduleResponse);
let ProtocolFeature = class ProtocolFeature extends Struct {
};
tslib.__decorate([
    Struct.field('checksum256')
], ProtocolFeature.prototype, "feature_digest", void 0);
tslib.__decorate([
    Struct.field('uint32')
], ProtocolFeature.prototype, "activation_ordinal", void 0);
tslib.__decorate([
    Struct.field('uint32')
], ProtocolFeature.prototype, "activation_block_num", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], ProtocolFeature.prototype, "description_digest", void 0);
tslib.__decorate([
    Struct.field('string', { array: true })
], ProtocolFeature.prototype, "dependencies", void 0);
tslib.__decorate([
    Struct.field('string')
], ProtocolFeature.prototype, "protocol_feature_type", void 0);
tslib.__decorate([
    Struct.field('any', { array: true })
], ProtocolFeature.prototype, "specification", void 0);
ProtocolFeature = tslib.__decorate([
    Struct.type('protocol_feature')
], ProtocolFeature);
let GetProtocolFeaturesResponse = class GetProtocolFeaturesResponse extends Struct {
};
tslib.__decorate([
    Struct.field(ProtocolFeature, { array: true })
], GetProtocolFeaturesResponse.prototype, "activated_protocol_features", void 0);
tslib.__decorate([
    Struct.field('uint32', { optional: true })
], GetProtocolFeaturesResponse.prototype, "more", void 0);
GetProtocolFeaturesResponse = tslib.__decorate([
    Struct.type('get_protocol_features_response')
], GetProtocolFeaturesResponse);

var types$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get AccountByAuthorizersRow () { return AccountByAuthorizersRow; },
    get AccountLinkedAction () { return AccountLinkedAction; },
    get AccountObject () { return AccountObject; },
    get AccountPermission () { return AccountPermission; },
    get AccountRefundRequest () { return AccountRefundRequest; },
    get AccountResourceLimit () { return AccountResourceLimit; },
    get AccountRexInfo () { return AccountRexInfo; },
    get AccountRexInfoMaturities () { return AccountRexInfoMaturities; },
    get AccountSelfDelegatedBandwidth () { return AccountSelfDelegatedBandwidth; },
    get AccountTotalResources () { return AccountTotalResources; },
    get AccountVoterInfo () { return AccountVoterInfo; },
    get AccountsByAuthorizers () { return AccountsByAuthorizers; },
    get ActiveSchedule () { return ActiveSchedule; },
    get ActiveScheduleProducer () { return ActiveScheduleProducer; },
    get ActiveScheduleProducerAuthority () { return ActiveScheduleProducerAuthority; },
    get BlockExtension () { return BlockExtension$1; },
    get BlockStateHeader () { return BlockStateHeader; },
    get GetActionsResponse () { return GetActionsResponse; },
    get GetBlockHeaderStateResponse () { return GetBlockHeaderStateResponse; },
    get GetBlockInfoResponse () { return GetBlockInfoResponse; },
    get GetBlockResponse () { return GetBlockResponse; },
    get GetBlockResponseTransactionReceipt () { return GetBlockResponseTransactionReceipt; },
    get GetCodeResponse () { return GetCodeResponse; },
    get GetControlledAccountsResponse () { return GetControlledAccountsResponse; },
    get GetCurrencyStatsItemResponse () { return GetCurrencyStatsItemResponse; },
    get GetInfoResponse () { return GetInfoResponse; },
    get GetKeyAccountsResponse () { return GetKeyAccountsResponse; },
    get GetProducerScheduleResponse () { return GetProducerScheduleResponse; },
    get GetProtocolFeaturesResponse () { return GetProtocolFeaturesResponse; },
    get GetRawAbiResponse () { return GetRawAbiResponse; },
    get GetTableByScopeResponse () { return GetTableByScopeResponse; },
    get GetTableByScopeResponseRow () { return GetTableByScopeResponseRow; },
    get GetTransactionResponse () { return GetTransactionResponse; },
    get GetTransactionStatusResponse () { return GetTransactionStatusResponse; },
    get HeaderExtension () { return HeaderExtension$1; },
    get NewProducers () { return NewProducers$1; },
    get NewProducersEntry () { return NewProducersEntry$1; },
    get OrderedActionsResult () { return OrderedActionsResult; },
    get Producer () { return Producer; },
    get ProducerAuthority () { return ProducerAuthority; },
    get ProducerSchedule () { return ProducerSchedule; },
    get ProtocolFeature () { return ProtocolFeature; },
    get TransactionInfo () { return TransactionInfo; },
    get TransactionTrace () { return TransactionTrace; },
    get Trx () { return Trx; },
    TrxVariant: TrxVariant$1
});

class ChainAPI {
    constructor(client) {
        this.client = client;
    }
    get_abi(accountName) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_abi',
                params: { account_name: Name.from(accountName) },
            });
        });
    }
    get_code(accountName) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_code',
                params: { account_name: Name.from(accountName) },
                responseType: GetCodeResponse,
            });
        });
    }
    get_raw_abi(accountName) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_raw_abi',
                params: { account_name: Name.from(accountName) },
                responseType: GetRawAbiResponse,
            });
        });
    }
    get_account(accountName, responseType = AccountObject) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_account',
                params: { account_name: Name.from(accountName) },
                responseType: responseType,
            });
        });
    }
    get_accounts_by_authorizers(params) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_accounts_by_authorizers',
                params,
                responseType: AccountsByAuthorizers,
            });
        });
    }
    get_activated_protocol_features(params) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_activated_protocol_features',
                params,
                responseType: GetProtocolFeaturesResponse,
            });
        });
    }
    get_block(block_num_or_id) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_block',
                params: { block_num_or_id },
                responseType: GetBlockResponse,
            });
        });
    }
    get_block_header_state(block_num_or_id) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_block_header_state',
                params: { block_num_or_id },
                responseType: GetBlockHeaderStateResponse,
            });
        });
    }
    get_block_info(block_num) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_block_info',
                params: { block_num },
                responseType: GetBlockInfoResponse,
            });
        });
    }
    get_currency_balance(contract, accountName, symbol) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const params = {
                account: Name.from(accountName),
                code: Name.from(contract),
            };
            if (symbol) {
                params.symbol = symbol;
            }
            return this.client.call({
                path: '/v1/chain/get_currency_balance',
                params,
                responseType: 'asset[]',
            });
        });
    }
    get_currency_stats(contract, symbol) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const params = {
                code: Name.from(contract),
                symbol,
            };
            const response = yield this.client.call({
                path: '/v1/chain/get_currency_stats',
                params,
            });
            const result = {};
            Object.keys(response).forEach((r) => (result[r] = GetCurrencyStatsItemResponse.from(response[r])));
            return result;
        });
    }
    get_info() {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_info',
                responseType: GetInfoResponse,
                method: 'GET',
            });
        });
    }
    get_producer_schedule() {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_producer_schedule',
                responseType: GetProducerScheduleResponse,
            });
        });
    }
    compute_transaction(tx) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!isInstanceOf(tx, exports.PackedTransaction)) {
                tx = exports.PackedTransaction.fromSigned(exports.SignedTransaction.from(tx));
            }
            return this.client.call({
                path: '/v1/chain/compute_transaction',
                params: {
                    transaction: tx,
                },
            });
        });
    }
    send_read_only_transaction(tx) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!isInstanceOf(tx, exports.PackedTransaction)) {
                tx = exports.PackedTransaction.fromSigned(exports.SignedTransaction.from(tx));
            }
            return this.client.call({
                path: '/v1/chain/send_read_only_transaction',
                params: {
                    transaction: tx,
                },
            });
        });
    }
    push_transaction(tx) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!isInstanceOf(tx, exports.PackedTransaction)) {
                tx = exports.PackedTransaction.fromSigned(exports.SignedTransaction.from(tx));
            }
            return this.client.call({
                path: '/v1/chain/push_transaction',
                params: tx,
            });
        });
    }
    send_transaction(tx) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!isInstanceOf(tx, exports.PackedTransaction)) {
                tx = exports.PackedTransaction.fromSigned(exports.SignedTransaction.from(tx));
            }
            return this.client.call({
                path: '/v1/chain/send_transaction',
                params: tx,
            });
        });
    }
    send_transaction2(tx, options) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (!isInstanceOf(tx, exports.PackedTransaction)) {
                tx = exports.PackedTransaction.fromSigned(exports.SignedTransaction.from(tx));
            }
            return this.client.call({
                path: '/v1/chain/send_transaction2',
                params: Object.assign({ return_failure_trace: true, retry_trx: false, retry_trx_num_blocks: 0, transaction: tx }, options),
            });
        });
    }
    get_table_rows(params) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const type = params.type;
            let key_type = params.key_type;
            const someBound = params.lower_bound || params.upper_bound;
            if (!key_type && someBound) {
                // determine key type from bounds type
                if (isInstanceOf(someBound, UInt64)) {
                    key_type = 'i64';
                }
                else if (isInstanceOf(someBound, UInt128)) {
                    key_type = 'i128';
                }
                else if (isInstanceOf(someBound, Checksum256)) {
                    key_type = 'sha256';
                }
                else if (isInstanceOf(someBound, Checksum160)) {
                    key_type = 'ripemd160';
                }
            }
            if (!key_type) {
                key_type = 'name';
            }
            let json = params.json;
            if (json === undefined) {
                // if we know the row type don't ask the node to perform abi decoding
                json = type === undefined;
            }
            let upper_bound = params.upper_bound;
            if (upper_bound && typeof upper_bound !== 'string') {
                upper_bound = String(upper_bound);
            }
            let lower_bound = params.lower_bound;
            if (lower_bound && typeof lower_bound !== 'string') {
                lower_bound = String(lower_bound);
            }
            let scope = params.scope;
            if (typeof scope === 'undefined') {
                scope = String(Name.from(params.code));
            }
            else if (typeof scope !== 'string') {
                scope = String(scope);
            }
            // eslint-disable-next-line prefer-const
            let { rows, more, next_key } = yield this.client.call({
                path: '/v1/chain/get_table_rows',
                params: Object.assign(Object.assign({}, params), { code: Name.from(params.code), table: Name.from(params.table), limit: params.limit !== undefined ? UInt32.from(params.limit) : undefined, scope,
                    key_type,
                    json,
                    upper_bound,
                    lower_bound }),
            });
            let ram_payers;
            if (params.show_payer) {
                ram_payers = [];
                rows = rows.map(({ data, payer }) => {
                    ram_payers.push(Name.from(payer));
                    return data;
                });
            }
            if (type) {
                if (json) {
                    rows = rows.map((value) => {
                        if (typeof value === 'string' && Bytes.isBytes(value)) {
                            // this handles the case where nodeos bails on abi decoding and just returns a hex string
                            return exports.Serializer.decode({ data: Bytes.from(value), type });
                        }
                        else {
                            return exports.Serializer.decode({ object: value, type });
                        }
                    });
                }
                else {
                    rows = rows
                        .map((hex) => Bytes.from(hex))
                        .map((data) => exports.Serializer.decode({ data, type }));
                }
            }
            if (next_key && next_key.length > 0) {
                let indexType;
                // set index type so we can decode next_key in the response if present
                switch (key_type) {
                    case 'i64':
                        indexType = UInt64;
                        break;
                    case 'i128':
                        indexType = UInt128;
                        break;
                    case 'name':
                        indexType = Name;
                        break;
                    case 'float64':
                        indexType = Float64;
                        break;
                    case 'float128':
                        indexType = Float128;
                        break;
                    case 'sha256':
                        indexType = Checksum256;
                        break;
                    case 'ripemd160':
                        indexType = Checksum160;
                        break;
                    default:
                        throw new Error(`Unsupported key type: ${key_type}`);
                }
                if (indexType === Name) {
                    // names are sent back as an uint64 string instead of a name string..
                    next_key = Name.from(exports.Serializer.decode({ object: next_key, type: UInt64 }));
                }
                else {
                    next_key = exports.Serializer.decode({ object: next_key, type: indexType });
                }
            }
            else {
                next_key = undefined;
            }
            return { rows, more, next_key, ram_payers };
        });
    }
    get_table_by_scope(params) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_table_by_scope',
                params,
                responseType: GetTableByScopeResponse,
            });
        });
    }
    get_transaction_status(id) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/chain/get_transaction_status',
                params: {
                    id: Checksum256.from(id),
                },
                responseType: GetTransactionStatusResponse,
            });
        });
    }
}

class HistoryAPI {
    constructor(client) {
        this.client = client;
    }
    get_actions(accountName, pos, offset) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/history/get_actions',
                params: {
                    account_name: Name.from(accountName),
                    pos: Int32.from(pos),
                    offset: Int32.from(offset),
                },
                responseType: GetActionsResponse,
            });
        });
    }
    get_transaction(id, options = {}) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/history/get_transaction',
                params: {
                    id: Checksum256.from(id),
                    block_num_hint: options.blockNumHint && UInt32.from(options.blockNumHint),
                    traces: options.excludeTraces === true ? false : undefined,
                },
                responseType: GetTransactionResponse,
            });
        });
    }
    get_key_accounts(publicKey) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/history/get_key_accounts',
                params: { public_key: PublicKey.from(publicKey) },
                responseType: GetKeyAccountsResponse,
            });
        });
    }
    get_controlled_accounts(controllingAccount) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return this.client.call({
                path: '/v1/history/get_controlled_accounts',
                params: { controlling_account: Name.from(controllingAccount) },
                responseType: GetControlledAccountsResponse,
            });
        });
    }
}

class APIError extends Error {
    static formatError(error) {
        if (error.what === 'unspecified' &&
            error.details[0].file &&
            error.details[0].file === 'http_plugin.cpp' &&
            error.details[0].message.slice(0, 11) === 'unknown key') {
            // fix cryptic error messages from nodeos for missing accounts
            return 'Account not found';
        }
        else if (error.what === 'unspecified' && error.details && error.details.length > 0) {
            return error.details[0].message;
        }
        else if (error.what && error.what.length > 0) {
            return error.what;
        }
        else {
            return 'Unknown API error';
        }
    }
    constructor(path, response) {
        let message;
        if (response.json && response.json.error) {
            message = `${APIError.formatError(response.json.error)} at ${path}`;
        }
        else {
            message = `HTTP ${response.status} at ${path}`;
        }
        super(message);
        this.path = path;
        this.response = response;
    }
    /** The nodeos error object. */
    get error() {
        const { json } = this.response;
        return (json ? json.error : undefined);
    }
    /** The nodeos error name, e.g. `tx_net_usage_exceeded` */
    get name() {
        const { error } = this;
        return error ? error.name : 'unspecified';
    }
    /** The nodeos error code, e.g. `3080002`. */
    get code() {
        const { error } = this;
        return error ? error.code : 0;
    }
    /** List of exceptions, if any. */
    get details() {
        const { error } = this;
        return error ? error.details : [];
    }
}
APIError.__className = 'APIError';
class APIClient {
    constructor(options) {
        this.v1 = {
            chain: new ChainAPI(this),
            history: new HistoryAPI(this),
        };
        if (options.provider) {
            this.provider = options.provider;
        }
        else if (options.url) {
            this.provider = new FetchProvider(options.url, options);
        }
        else {
            throw new Error('Missing url or provider');
        }
    }
    call(args) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const response = yield this.provider.call(args);
            const { json } = response;
            if (Math.floor(response.status / 100) !== 2 || (json && typeof json.error === 'object')) {
                throw new APIError(args.path, response);
            }
            if (args.responseType) {
                return abiDecode({ type: args.responseType, object: response.json });
            }
            return response.json || response.text;
        });
    }
}
APIClient.__className = 'APIClient';

var types$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    v1: types$2
});

var BlockHeader_1;
let HandshakeMessage = class HandshakeMessage extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], HandshakeMessage.prototype, "networkVersion", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], HandshakeMessage.prototype, "chainId", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], HandshakeMessage.prototype, "nodeId", void 0);
tslib.__decorate([
    Struct.field('public_key')
], HandshakeMessage.prototype, "key", void 0);
tslib.__decorate([
    Struct.field('int64')
], HandshakeMessage.prototype, "time", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], HandshakeMessage.prototype, "token", void 0);
tslib.__decorate([
    Struct.field('signature')
], HandshakeMessage.prototype, "sig", void 0);
tslib.__decorate([
    Struct.field('string')
], HandshakeMessage.prototype, "p2pAddress", void 0);
tslib.__decorate([
    Struct.field('uint32')
], HandshakeMessage.prototype, "lastIrreversibleBlockNumber", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], HandshakeMessage.prototype, "lastIrreversibleBlockId", void 0);
tslib.__decorate([
    Struct.field('uint32')
], HandshakeMessage.prototype, "headNum", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], HandshakeMessage.prototype, "headId", void 0);
tslib.__decorate([
    Struct.field('string')
], HandshakeMessage.prototype, "os", void 0);
tslib.__decorate([
    Struct.field('string')
], HandshakeMessage.prototype, "agent", void 0);
tslib.__decorate([
    Struct.field('int16')
], HandshakeMessage.prototype, "generation", void 0);
HandshakeMessage = tslib.__decorate([
    Struct.type('handshake_message')
], HandshakeMessage);
let ChainSizeMessage = class ChainSizeMessage extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], ChainSizeMessage.prototype, "lastIrreversibleBlockNumber", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], ChainSizeMessage.prototype, "lastIrreversibleBlockId", void 0);
tslib.__decorate([
    Struct.field('uint32')
], ChainSizeMessage.prototype, "headNum", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], ChainSizeMessage.prototype, "headId", void 0);
ChainSizeMessage = tslib.__decorate([
    Struct.type('chain_size_message')
], ChainSizeMessage);
let GoAwayMessage = class GoAwayMessage extends Struct {
};
tslib.__decorate([
    Struct.field('uint8')
], GoAwayMessage.prototype, "reason", void 0);
tslib.__decorate([
    Struct.field('checksum256')
], GoAwayMessage.prototype, "nodeId", void 0);
GoAwayMessage = tslib.__decorate([
    Struct.type('go_away_message')
], GoAwayMessage);
let TimeMessage = class TimeMessage extends Struct {
};
tslib.__decorate([
    Struct.field('int64')
], TimeMessage.prototype, "org", void 0);
tslib.__decorate([
    Struct.field('int64')
], TimeMessage.prototype, "rec", void 0);
tslib.__decorate([
    Struct.field('int64')
], TimeMessage.prototype, "xmt", void 0);
tslib.__decorate([
    Struct.field('int64')
], TimeMessage.prototype, "dst", void 0);
TimeMessage = tslib.__decorate([
    Struct.type('time_message')
], TimeMessage);
let NoticeMessage = class NoticeMessage extends Struct {
};
tslib.__decorate([
    Struct.field('checksum256', { array: true })
], NoticeMessage.prototype, "knownTrx", void 0);
tslib.__decorate([
    Struct.field(BlockId, { array: true })
], NoticeMessage.prototype, "knownBlocks", void 0);
NoticeMessage = tslib.__decorate([
    Struct.type('notice_message')
], NoticeMessage);
let RequestMessage = class RequestMessage extends Struct {
};
tslib.__decorate([
    Struct.field('checksum256', { array: true })
], RequestMessage.prototype, "reqTrx", void 0);
tslib.__decorate([
    Struct.field(BlockId, { array: true })
], RequestMessage.prototype, "reqBlocks", void 0);
RequestMessage = tslib.__decorate([
    Struct.type('request_message')
], RequestMessage);
let SyncRequestMessage = class SyncRequestMessage extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], SyncRequestMessage.prototype, "startBlock", void 0);
tslib.__decorate([
    Struct.field('uint32')
], SyncRequestMessage.prototype, "endBlock", void 0);
SyncRequestMessage = tslib.__decorate([
    Struct.type('sync_request_message')
], SyncRequestMessage);
let NewProducersEntry = class NewProducersEntry extends Struct {
};
tslib.__decorate([
    Struct.field('name')
], NewProducersEntry.prototype, "producer_name", void 0);
tslib.__decorate([
    Struct.field('public_key')
], NewProducersEntry.prototype, "block_signing_key", void 0);
NewProducersEntry = tslib.__decorate([
    Struct.type('new_producers_entry')
], NewProducersEntry);
let NewProducers = class NewProducers extends Struct {
};
tslib.__decorate([
    Struct.field('uint32')
], NewProducers.prototype, "version", void 0);
tslib.__decorate([
    Struct.field(NewProducersEntry, { array: true })
], NewProducers.prototype, "producers", void 0);
NewProducers = tslib.__decorate([
    Struct.type('new_producers')
], NewProducers);
let BlockExtension = class BlockExtension extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], BlockExtension.prototype, "type", void 0);
tslib.__decorate([
    Struct.field('bytes')
], BlockExtension.prototype, "data", void 0);
BlockExtension = tslib.__decorate([
    Struct.type('block_extension')
], BlockExtension);
let HeaderExtension = class HeaderExtension extends Struct {
};
tslib.__decorate([
    Struct.field('uint16')
], HeaderExtension.prototype, "type", void 0);
tslib.__decorate([
    Struct.field('bytes')
], HeaderExtension.prototype, "data", void 0);
HeaderExtension = tslib.__decorate([
    Struct.type('header_extension')
], HeaderExtension);
let TrxVariant = class TrxVariant extends Variant {
};
TrxVariant = tslib.__decorate([
    Variant.type('trx_variant', [Checksum256, exports.PackedTransaction])
], TrxVariant);
let FullTransactionReceipt = class FullTransactionReceipt extends Struct {
};
tslib.__decorate([
    Struct.field(UInt8)
], FullTransactionReceipt.prototype, "status", void 0);
tslib.__decorate([
    Struct.field(UInt32)
], FullTransactionReceipt.prototype, "cpu_usage_us", void 0);
tslib.__decorate([
    Struct.field(VarUInt)
], FullTransactionReceipt.prototype, "net_usage_words", void 0);
tslib.__decorate([
    Struct.field(TrxVariant)
], FullTransactionReceipt.prototype, "trx", void 0);
FullTransactionReceipt = tslib.__decorate([
    Struct.type('full_transaction_receipt')
], FullTransactionReceipt);
let BlockHeader = BlockHeader_1 = class BlockHeader extends Struct {
    get blockNum() {
        return this.previous.blockNum.adding(1);
    }
    get id() {
        const id = Checksum256.hash(exports.Serializer.encode({ object: this, type: BlockHeader_1 }));
        return BlockId.fromBlockChecksum(id, this.blockNum);
    }
};
tslib.__decorate([
    Struct.field('uint32')
], BlockHeader.prototype, "timeSlot", void 0);
tslib.__decorate([
    Struct.field('name')
], BlockHeader.prototype, "producer", void 0);
tslib.__decorate([
    Struct.field('uint16')
], BlockHeader.prototype, "confirmed", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], BlockHeader.prototype, "previous", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], BlockHeader.prototype, "transaction_mroot", void 0);
tslib.__decorate([
    Struct.field(BlockId)
], BlockHeader.prototype, "action_mroot", void 0);
tslib.__decorate([
    Struct.field('uint32')
], BlockHeader.prototype, "schedule_version", void 0);
tslib.__decorate([
    Struct.field(NewProducers, { optional: true })
], BlockHeader.prototype, "new_producers", void 0);
tslib.__decorate([
    Struct.field(HeaderExtension, { array: true })
], BlockHeader.prototype, "header_extensions", void 0);
BlockHeader = BlockHeader_1 = tslib.__decorate([
    Struct.type('block_header')
], BlockHeader);
let SignedBlock = class SignedBlock extends BlockHeader {
};
tslib.__decorate([
    Struct.field('signature')
], SignedBlock.prototype, "producer_signature", void 0);
tslib.__decorate([
    Struct.field(FullTransactionReceipt, { array: true })
], SignedBlock.prototype, "transactions", void 0);
tslib.__decorate([
    Struct.field(BlockExtension, { array: true })
], SignedBlock.prototype, "block_extensions", void 0);
SignedBlock = tslib.__decorate([
    Struct.type('signed_block')
], SignedBlock);
let NetMessage = class NetMessage extends Variant {
};
NetMessage = tslib.__decorate([
    Variant.type('net_message', [
        HandshakeMessage,
        ChainSizeMessage,
        GoAwayMessage,
        TimeMessage,
        NoticeMessage,
        RequestMessage,
        SyncRequestMessage,
        SignedBlock,
        exports.PackedTransaction,
    ])
], NetMessage);

var types = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get BlockExtension () { return BlockExtension; },
    get BlockHeader () { return BlockHeader; },
    get ChainSizeMessage () { return ChainSizeMessage; },
    get FullTransactionReceipt () { return FullTransactionReceipt; },
    get GoAwayMessage () { return GoAwayMessage; },
    get HandshakeMessage () { return HandshakeMessage; },
    get HeaderExtension () { return HeaderExtension; },
    get NetMessage () { return NetMessage; },
    get NewProducers () { return NewProducers; },
    get NewProducersEntry () { return NewProducersEntry; },
    get NoticeMessage () { return NoticeMessage; },
    get RequestMessage () { return RequestMessage; },
    get SignedBlock () { return SignedBlock; },
    get SyncRequestMessage () { return SyncRequestMessage; },
    get TimeMessage () { return TimeMessage; }
});

class P2PClient {
    constructor(options) {
        if (options.provider) {
            this.provider = options.provider;
        }
        else {
            throw new Error('Missing provider');
        }
        if (options.setTimeoutImpl !== undefined) {
            this.setTimeoutImpl = options.setTimeoutImpl;
        }
        else {
            this.setTimeoutImpl = setTimeout;
        }
        if (options.heartbeatTimoutMs !== undefined) {
            this.heartbeatTimoutMs = options.heartbeatTimoutMs;
            this.resetHeartbeat();
        }
        this.provider.on('data', (data) => {
            this.handleData(data);
        });
        this.provider.on('error', (e) => {
            this.emit('error', [e]);
        });
        this.provider.on('close', () => {
            this.emit('close', []);
        });
        this.eventListeners = {};
    }
    send(message, done) {
        const wrappedMessage = NetMessage.from(message);
        const messageBuffer = exports.Serializer.encode({ object: wrappedMessage });
        this.provider.write(messageBuffer.array, done);
    }
    end(cb) {
        this.endHeartbeat();
        this.provider.end(cb);
    }
    destroy(err) {
        this.endHeartbeat();
        this.provider.destroy(err);
    }
    handleData(data) {
        try {
            const message = exports.Serializer.decode({ type: NetMessage, data });
            this.emit('message', [message]);
        }
        catch (e) {
            this.emit('error', [e]);
        }
    }
    endHeartbeat() {
        if (this.heartbeatTimoutId !== undefined) {
            clearTimeout(this.heartbeatTimoutId);
            this.heartbeatTimoutId = undefined;
        }
    }
    resetHeartbeat() {
        this.endHeartbeat();
        if (this.heartbeatTimoutMs !== undefined) {
            this.setTimeoutImpl(() => {
                this.handleHeartbeat();
            }, this.heartbeatTimoutMs);
        }
    }
    handleHeartbeat() {
        const now = Date.now();
        const timeMessage = TimeMessage.from({
            org: now,
            rec: 0,
            xmt: 0,
            dst: 0,
        });
        this.send(timeMessage, () => {
            this.resetHeartbeat();
        });
    }
    on(event, handler) {
        return this.addListenerInternal(event, handler, false, false);
    }
    once(event, handler) {
        return this.addListenerInternal(event, handler, true, false);
    }
    addListener(event, handler) {
        return this.addListenerInternal(event, handler, false, false);
    }
    prependListener(event, handler) {
        return this.addListenerInternal(event, handler, false, true);
    }
    removeListener(event, handler) {
        if (this.eventListeners[event] !== undefined) {
            this.eventListeners[event] = this.eventListeners[event].filter((e) => {
                return e.handler !== handler;
            });
        }
        return this;
    }
    addListenerInternal(event, handler, once, prepend) {
        if (this.eventListeners[event] === undefined) {
            this.eventListeners[event] = [];
        }
        if (!prepend) {
            this.eventListeners[event].push({ once, handler });
        }
        else {
            this.eventListeners[event].unshift({ once, handler });
        }
        return this;
    }
    emit(event, args) {
        if (this.eventListeners[event] === undefined) {
            return;
        }
        for (const { handler } of this.eventListeners[event]) {
            // typescript is loosing the specificity provided by T in the assignment above
            const erasedHandler = handler;
            erasedHandler(...args);
        }
        this.eventListeners[event] = this.eventListeners[event].filter((e) => {
            return e.once !== true;
        });
    }
}
P2PClient.__className = 'P2PClient';

class SimpleEnvelopeP2PProvider {
    constructor(nextProvider) {
        this.nextProvider = nextProvider;
        this.remainingData = new Uint8Array(0);
        this.dataHandlers = [];
        this.errorHandlers = [];
        // process nextProvider data
        this.nextProvider.on('data', (data) => {
            const newData = new Uint8Array(this.remainingData.byteLength + data.byteLength);
            newData.set(this.remainingData, 0);
            newData.set(data, this.remainingData.byteLength);
            this.remainingData = newData;
            while (this.remainingData.byteLength >= 4) {
                const view = new DataView(this.remainingData.buffer);
                const messageLength = view.getUint32(0, true);
                if (messageLength > SimpleEnvelopeP2PProvider.maxReadLength) {
                    this.emitError(new Error('Incoming Message too long'));
                }
                if (this.remainingData.byteLength < 4 + messageLength) {
                    // need more data
                    break;
                }
                const messageBuffer = this.remainingData.subarray(4, 4 + messageLength);
                this.remainingData = this.remainingData.slice(4 + messageLength);
                this.emitData(messageBuffer);
            }
        });
        // proxy error
        this.nextProvider.on('error', (err) => {
            this.emitError(err);
        });
    }
    write(data, done) {
        const nextBuffer = new Uint8Array(4 + data.byteLength);
        const view = new DataView(nextBuffer.buffer);
        view.setUint32(0, data.byteLength, true);
        nextBuffer.set(data, 4);
        this.nextProvider.write(nextBuffer, done);
    }
    end(cb) {
        this.nextProvider.end(cb);
    }
    destroy(err) {
        this.nextProvider.destroy(err);
    }
    on(event, handler) {
        if (event === 'data') {
            this.dataHandlers.push(handler);
        }
        else if (event === 'error') {
            this.errorHandlers.push(handler);
        }
        else {
            this.nextProvider.on(event, handler);
        }
        return this;
    }
    emitData(messageBuffer) {
        for (const handler of this.dataHandlers) {
            // typescript is loosing the specificity provided by T in the assignment above
            handler(messageBuffer);
        }
    }
    emitError(err) {
        for (const handler of this.errorHandlers) {
            // typescript is loosing the specificity provided by T in the assignment above
            handler(err);
        }
    }
}
SimpleEnvelopeP2PProvider.maxReadLength = 8 * 1024 * 1024;

exports.ABI = ABI;
exports.ABIDecoder = ABIDecoder;
exports.ABIEncoder = ABIEncoder;
exports.API = types$1;
exports.APIClient = APIClient;
exports.APIError = APIError;
exports.Asset = Asset;
exports.Blob = Blob;
exports.BlockId = BlockId;
exports.BlockTimestamp = BlockTimestamp;
exports.Bytes = Bytes;
exports.ChainAPI = ChainAPI;
exports.Checksum160 = Checksum160;
exports.Checksum256 = Checksum256;
exports.Checksum512 = Checksum512;
exports.ExtendedAsset = ExtendedAsset;
exports.ExtendedSymbol = ExtendedSymbol;
exports.FetchProvider = FetchProvider;
exports.Float128 = Float128;
exports.Float32 = Float32;
exports.Float64 = Float64;
exports.HistoryAPI = HistoryAPI;
exports.Int = Int;
exports.Int128 = Int128;
exports.Int16 = Int16;
exports.Int32 = Int32;
exports.Int64 = Int64;
exports.Int8 = Int8;
exports.Name = Name;
exports.P2P = types;
exports.P2PClient = P2PClient;
exports.PrivateKey = PrivateKey;
exports.PublicKey = PublicKey;
exports.Signature = Signature;
exports.SimpleEnvelopeP2PProvider = SimpleEnvelopeP2PProvider;
exports.Struct = Struct;
exports.TimePoint = TimePoint;
exports.TimePointSec = TimePointSec;
exports.TypeAlias = TypeAlias;
exports.UInt128 = UInt128;
exports.UInt16 = UInt16;
exports.UInt32 = UInt32;
exports.UInt64 = UInt64;
exports.UInt8 = UInt8;
exports.VarInt = VarInt;
exports.VarUInt = VarUInt;
exports.Variant = Variant;
exports.addressToWireName = addressToWireName;
exports.arrayEquals = arrayEquals;
exports.arrayEquatableEquals = arrayEquatableEquals;
exports.arrayToHex = arrayToHex;
exports.hexToArray = hexToArray;
exports.isInstanceOf = isInstanceOf;
exports.secureRandom = secureRandom;
//# sourceMappingURL=core.js.map
