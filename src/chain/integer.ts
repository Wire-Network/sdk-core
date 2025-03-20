import BN from 'bn.js';
import {ethers} from 'ethers';
import {ABISerializableObject} from '../serializer/serializable';
import {ABIDecoder} from '../serializer/decoder';
import {ABIEncoder} from '../serializer/encoder';
import {isInstanceOf, secureRandom} from '../utils';

type IntType = Int | number | string | BN;

interface IntDescriptor {
    isSigned: boolean;
    byteWidth: number;
}

/**
 * How to handle integer overflow.
 * - `throw`: Throws an error if value overflows (or underflows).
 * - `truncate`: Truncates or extends bit-pattern with sign extension (C++11 behavior).
 * - `clamp`: Clamps the value within the supported range.
 */
export type OverflowBehavior = 'throw' | 'truncate' | 'clamp';

/**
 * How to handle remainder when dividing integers.
 * - `floor`: Round down to nearest integer.
 * - `round`: Round to nearest integer.
 * - `ceil`: Round up to nearest integer.
 */
export type DivisionBehavior = 'floor' | 'round' | 'ceil';

/**
 * Binary integer with the underlying value represented by a BN.js instance.
 * Follows C++11 standard for arithmetic operators and conversions.
 * @note This type is optimized for correctness not speed, if you plan to manipulate
 *       integers in a tight loop you're advised to use the underlying BN.js value or
 *       convert to a JavaScript number first.
 */
export class Int implements ABISerializableObject {
    static abiName = '__int';
    static isSigned: boolean;
    static byteWidth: number;

    /** Largest value that can be represented by this integer type. */
    static get max() {
        return new BN(2).pow(new BN(this.byteWidth * 8 - (this.isSigned ? 1 : 0))).isubn(1);
    }

    /** Smallest value that can be represented by this integer type. */
    static get min() {
        return this.isSigned ? this.max.ineg().isubn(1) : new BN(0);
    }

    /** Add `lhs` to `rhs` and return the resulting value. */
    static add(lhs: Int, rhs: Int, overflow: OverflowBehavior = 'truncate'): Int {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.add(b));
    }

    /** Add `lhs` to `rhs` and return the resulting value. */
    static sub(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.sub(b));
    }

    /** Multiply `lhs` by `rhs` and return the resulting value. */
    static mul(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.mul(b));
    }

    /**
     * Divide `lhs` by `rhs` and return the quotient, dropping the remainder.
     * @throws When dividing by zero.
     */
    static div(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int {
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
    static divRound(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int {
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
    static divCeil(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }

            const dm = (a as any).divmod(b);
            if (dm.mod.isZero()) return dm.div;
            return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        });
    }

    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than `rhs`. */
    static gt(lhs: Int, rhs: Int) {
        return lhs.value.gt(rhs.value);
    }

    /** Compare `lhs` to `rhs` and return true if `lhs` is less than `rhs`. */
    static lt(lhs: Int, rhs: Int) {
        return lhs.value.lt(rhs.value);
    }

    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than or equal to `rhs`. */
    static gte(lhs: Int, rhs: Int) {
        return lhs.value.gte(rhs.value);
    }

    /** Compare `lhs` to `rhs` and return true if `lhs` is less than or equal to `rhs`. */
    static lte(lhs: Int, rhs: Int) {
        return lhs.value.lte(rhs.value);
    }

    /**
     * Can be used to implement custom operator.
     * @internal
     */
    static operator(
        lhs: Int,
        rhs: Int,
        overflow: OverflowBehavior = 'truncate',
        fn: (lhs: BN, rhs: BN) => BN
    ) {
        const {a, b} = convert(lhs, rhs);
        const type = a.constructor as typeof Int;
        const result = fn(a.value, b.value);
        return type.from(result, overflow);
    }

    /**
     * Create a new instance from value.
     * @param value Value to create new Int instance from, can be a string, number,
     *              little-endian byte array or another Int instance.
     * @param overflow How to handle integer overflow, default behavior is to throw.
     */
    static from<T extends typeof Int>(
        this: T,
        value: IntType | Uint8Array,
        overflow?: OverflowBehavior
    ): InstanceType<T>;
    static from(value: any, overflow?: OverflowBehavior): unknown;
    static from(value: IntType | Uint8Array, overflow?: OverflowBehavior): any {
        if (isInstanceOf(value, this)) {
            return value;
        }

        let fromType: IntDescriptor = this;
        let bn: BN;

        if (isInstanceOf(value, Int)) {
            fromType = value.constructor as typeof Int;
            bn = value.value.clone();
        } else if (value instanceof Uint8Array) {
            bn = new BN(value, undefined, 'le');

            if (fromType.isSigned) {
                bn = bn.fromTwos(fromType.byteWidth * 8);
            }
        } else {
            if (
                (typeof value === 'string' && !/[0-9]+/.test(value)) ||
                (typeof value === 'number' && !Number.isFinite(value))
            ) {
                throw new Error('Invalid number');
            }

            bn = BN.isBN(value) ? value.clone() : new BN(value, 10);

            if (bn.isNeg() && !fromType.isSigned) {
                fromType = {byteWidth: fromType.byteWidth, isSigned: true};
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

    static fromABI<T extends typeof Int>(this: T, decoder: ABIDecoder): InstanceType<T>;
    static fromABI(decoder: ABIDecoder): unknown;
    static fromABI(decoder: ABIDecoder) {
        return this.from(decoder.readArray(this.byteWidth));
    }

    static abiDefault() {
        return this.from(0);
    }

    static random<T extends typeof Int>(this: T): InstanceType<T>;
    static random(): unknown;
    static random() {
        return this.from(secureRandom(this.byteWidth));
    }

    /**
     * The underlying BN.js instance – don't modify this
     * directly – take a copy first using `.clone()`.
     */
    value: BN;

    /**
     * Create a new instance, don't use this directly. Use the `.from` factory method instead.
     * @throws If the value over- or under-flows the integer type.
     */
    constructor(value: BN) {
        const self = this.constructor as typeof Int;

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

    /**
     * Cast this integer to other type.
     * @param overflow How to handle overflow, default is to preserve bit-pattern (C++11 behavior).
     */
    cast<T extends typeof Int>(type: T, overflow?: OverflowBehavior): InstanceType<T>;
    cast(type: typeof Int, overflow: OverflowBehavior = 'truncate'): InstanceType<typeof Int> {
        if (this.constructor === type) {
            return this;
        }

        return type.from(this, overflow);
    }

    /** Number as bytes in little endian (matches memory layout in C++ contract). */
    get byteArray(): Uint8Array {
        const self = this.constructor as typeof Int;
        const value = self.isSigned ? this.value.toTwos(self.byteWidth * 8) : this.value;
        return value.toArrayLike(Uint8Array as any, 'le', self.byteWidth);
    }

    /**
     * Compare two integers, if strict is set to true the test will only consider integers
     * of the exact same type. I.e. Int64.from(1).equals(UInt64.from(1)) will return false.
     */
    equals(other: IntType | Uint8Array, strict = false) {
        const self = this.constructor as typeof Int;

        if (strict === true && isInstanceOf(other, Int)) {
            const otherType = other.constructor as typeof Int;

            if (self.byteWidth !== otherType.byteWidth || self.isSigned !== otherType.isSigned) {
                return false;
            }
        }

        try {
            return this.value.eq(self.from(other).value);
        } catch {
            return false;
        }
    }

    /** Mutating add. */
    add(num: IntType) {
        this.value = this.operator(num, Int.add).value;
    }

    /** Non-mutating add. */
    adding(num: IntType) {
        return this.operator(num, Int.add);
    }

    /** Mutating subtract. */
    subtract(num: IntType) {
        this.value = this.operator(num, Int.sub).value;
    }

    /** Non-mutating subtract. */
    subtracting(num: IntType) {
        return this.operator(num, Int.sub);
    }

    /** Mutating multiply. */
    multiply(by: IntType) {
        this.value = this.operator(by, Int.mul).value;
    }

    /** Non-mutating multiply. */
    multiplying(by: IntType) {
        return this.operator(by, Int.mul);
    }

    /**
     * Mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    divide(by: IntType, behavior?: DivisionBehavior) {
        this.value = this.dividing(by, behavior).value;
    }

    /**
     * Non-mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    dividing(by: IntType, behavior?: DivisionBehavior) {
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
    gt(other: Int) {
        return Int.gt(this, other);
    }

    /** Less than comparision operator */
    lt(other: Int) {
        return Int.lt(this, other);
    }

    /** Greater than or equal comparision operator */
    gte(other: Int) {
        return Int.gte(this, other);
    }

    /** Less than or equal comparision operator */
    lte(other: Int) {
        return Int.lte(this, other);
    }

    /**
     * Run operator with C++11 implicit conversion.
     * @internal
     */
    private operator(other: IntType, fn: (lhs: Int, rhs: Int) => Int): this {
        let rhs: Int;

        if (isInstanceOf(other, Int)) {
            rhs = other;
        } else {
            rhs = Int64.from(other, 'truncate');
        }

        return fn(this, rhs).cast(this.constructor as typeof Int) as this;
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

    [Symbol.toPrimitive](type: string) {
        if (type === 'number') {
            return this.toNumber();
        } else {
            return this.toString();
        }
    }

    toABI(encoder: ABIEncoder) {
        encoder.writeArray(this.byteArray);
    }

    toJSON() {
        // match FCs behavior and return strings for anything above 32-bit
        if (this.value.bitLength() > 32) {
            return this.value.toString();
        } else {
            return this.value.toNumber();
        }
    }
}

export type Int8Type = Int8 | IntType;
export class Int8 extends Int {
    static abiName = 'int8';
    static byteWidth = 1;
    static isSigned = true;
}

export type Int16Type = Int16 | IntType;
export class Int16 extends Int {
    static abiName = 'int16';
    static byteWidth = 2;
    static isSigned = true;
}

export type Int32Type = Int32 | IntType;
export class Int32 extends Int {
    static abiName = 'int32';
    static byteWidth = 4;
    static isSigned = true;
}

export type Int64Type = Int64 | IntType;
export class Int64 extends Int {
    static abiName = 'int64';
    static byteWidth = 8;
    static isSigned = true;
}

export type Int128Type = Int128 | IntType;
export class Int128 extends Int {
    static abiName = 'int128';
    static byteWidth = 16;
    static isSigned = true;
}

export type UInt8Type = UInt8 | IntType;
export class UInt8 extends Int {
    static abiName = 'uint8';
    static byteWidth = 1;
    static isSigned = false;
}

export type UInt16Type = UInt16 | IntType;
export class UInt16 extends Int {
    static abiName = 'uint16';
    static byteWidth = 2;
    static isSigned = false;
}

export type UInt32Type = UInt32 | IntType;
export class UInt32 extends Int {
    static abiName = 'uint32';
    static byteWidth = 4;
    static isSigned = false;
}

export type UInt64Type = UInt64 | IntType;
export class UInt64 extends Int {
    static abiName = 'uint64';
    static byteWidth = 8;
    static isSigned = false;
}

export type UInt128Type = UInt128 | IntType;
export class UInt128 extends Int {
    static abiName = 'uint128';
    static byteWidth = 16;
    static isSigned = false;
}

export type UInt256Type = UInt256 | UInt256Parts;
export interface UInt256Parts {
    low: number;
    high: number;
}

// Struct to match the 256-bit integer in Wire C++ Core contract
export class UInt256 {
    static readonly abiName = 'uint256';
    static readonly byteWidth = 32;
    static readonly isSigned = false;

    static readonly DECIMALS = 18;
    static readonly SCALE = new BN(10).pow(new BN(UInt256.DECIMALS));
    static readonly MAX_UINT256 = new BN(1).shln(256).isubn(1);  // 2^256 - 1

    low: UInt128;
    high: UInt128;

    constructor(low: UInt128, high: UInt128) {
        this.low = low;
        this.high = high;
    }

    /**
     * Create a UInt256 from a number, string, or UInt128 instance.
     * Interprets all values as 18-decimal fixed-point.
     */
    static from(value: number | string | UInt128): UInt256 {
        // Convert incoming to a decimal string
        const valueStr = value.toString();
        const [whole, frac = ""] = valueStr.split(".");

        const wholePart = new BN(whole || "0", 10).mul(this.SCALE);
        const fracPartStr = frac.padEnd(this.DECIMALS, "0").slice(0, this.DECIMALS);
        const fractionalPart = new BN(fracPartStr, 10);

        // Combine into one scaled BN
        const scaled = wholePart.add(fractionalPart);

        // Check 2^256 overflow
        if (scaled.gt(this.MAX_UINT256)) {
            throw new Error(`Value ${value} exceeds 256 bits once scaled`);
        }

        // Now split into low/high 128 bits
        const mask128 = new BN("ffffffffffffffffffffffffffffffff", 16); // 128 bits
        const lowBN = scaled.and(mask128);
        const highBN = scaled.shrn(128);

        return new UInt256(
            UInt128.from(lowBN), 
            UInt128.from(highBN),
        );
    }

    /**
     * Rereate a UInt256 class from its low and high parts as js numbers
     * Useful when creating UInt256 from the value stored in a smart contract
     */
    static recreate(value : UInt256Parts){
        return new UInt256(UInt128.from(value.low), UInt128.from(value.high));
    }

    /**
     * Construct a UInt256 from a raw 256-bit BN (no scaling).
     * Internal helper for add/sub/mul/div.
     */
    static fromRaw(raw: BN): UInt256 {
        if (raw.isNeg()) {
            throw new Error("Cannot represent negative values in UInt256");
        }

        if (raw.gt(this.MAX_UINT256)) {
            throw new Error("Uint256 overflow (larger than 2^256 - 1)");
        }

        const mask128 = new BN("ffffffffffffffffffffffffffffffff", 16);
        const lowBN = raw.and(mask128);
        const highBN = raw.shrn(128);

        return new UInt256(
            UInt128.from(lowBN),
            UInt128.from(highBN),
        );
    }

    /**
     * Helper to convert from ethers.BigNumber to our UInt256 type.
     * Useful when reading values from smart contracts. 
     * Like: balanceOf and allowance
     */
    fromBigNumber(value: ethers.BigNumber): UInt256 {
        const bn = new BN(value._hex.slice(2), 16)
        return UInt256.fromRaw(bn);
    }

    /**
     * Helper to combine `low` + `high` into a single BN that includes the
     * _already-scaled_ 10^18 factor.
     */
    raw(): BN {
        const lowBN = UInt256.u128ToBN(this.low);
        const highBN = UInt256.u128ToBN(this.high).shln(128);
        return highBN.add(lowBN);
    }

    /**
     * Convert the UInt256 to a human-readable string,
     * e.g. "123.456" for internal BN "123456000000000000000".
     */
    toString(): string {
        const scaled = this.raw();
        const intPart = scaled.div(UInt256.SCALE);
        const fracPart = scaled.mod(UInt256.SCALE);

        if (fracPart.isZero()) {
            // No fractional digits
            return intPart.toString(10);
        } else {
            // We have a fractional component
            const fracStr = fracPart
                .toString(10)
                .padStart(UInt256.DECIMALS, "0")
                .replace(/0+$/, ""); // remove trailing zeros
            return `${intPart}.${fracStr}`;
        }
    }

    /**
     * Convert the UInt256 to a JS number if safe; otherwise returns a BN.
     * This "descale" by 10^18 first, so "123.456" comes back as ~123.456 in JS.
     */
    toNumber(): number | BN {
        const scaled = this.raw(); // The big BN, e.g. 123.456 => 123456000000000000
        const integer = scaled.div(UInt256.SCALE); 
        const remainder = scaled.mod(UInt256.SCALE);
    
        // 1) If the integer part alone exceeds 2^53, return BN (or throw)
        if (integer.bitLength() > 53) {
            return new BN(this.toString()); 
        }
    
        // 2) Convert integer part safely
        const intNum = integer.toNumber(); // Guaranteed safe
    
        // 3) If no remainder, we have a whole number (like 123.000...)
        if (remainder.isZero()) {
            return intNum; 
        }
    
        // 4) We have a fractional part. Instead of remainder.toNumber(),
        //    convert remainder to decimal string, pad left to 18 digits,
        //    then parse as float in '0.xxxxx' form.
        const remainderStr = remainder.toString(10).padStart(UInt256.DECIMALS, '0');
        // e.g. "456000000000000000" => parseFloat("0.456000000000000000") => ~0.456
    
        // parseFloat of an 18-digit fraction is near the limit of JS float precision,
        // but it won't throw an error. You will get a float ~0.456
        const fracNum = parseFloat('0.' + remainderStr);
    
        // 5) Combine integer + fraction. If that sum is still <= 2^53,
        //    we return it; otherwise, return BN. 
        const result = intNum + fracNum;

        if (!Number.isFinite(result) || result > Number.MAX_SAFE_INTEGER) {
            return new BN(this.toString());
        }
    
        return result;
    }

    /**
     * Add another UInt256 (both 18-decimal scaled).
     */
    add(other: UInt256): UInt256 {
        const sum = this.raw().add(other.raw());
        return UInt256.fromRaw(sum);
    }

    /**
     * Subtract another UInt256. Throws if result < 0 (underflow).
     */
    subtract(other: UInt256): UInt256 {
        const diff = this.raw().sub(other.raw());

        if (diff.isNeg()) {
            throw new Error("Underflow in subtract");
        }

        return UInt256.fromRaw(diff);
    }

    /**
     * Multiply this UInt256 by another, then scale back down by 10^18
     * so final is still 18-decimals.
     *
     * So effectively: (a * b) / 10^18
     */
    multiply(other: UInt256): UInt256 {
        const product = this.raw().mul(other.raw()).div(UInt256.SCALE);
        return UInt256.fromRaw(product);
    }

    /**
     * Divide this UInt256 by another, scaling up the dividend by 10^18
     * first so final is still 18 decimals.
     *
     * So effectively: (a * 10^18) / b
     */
    divide(divisor: UInt256): UInt256 {
        const b = divisor.raw();

        if (b.isZero()) {
            throw new Error('Division by zero');
        }

        const numerator = this.raw().mul(UInt256.SCALE);
        const quotient = numerator.div(b);
        return UInt256.fromRaw(quotient);
    }

    /**
     * Modulo. Because both sides are scaled, we just do raw mod.
     * The result is still scaled with 18 decimals.
     */
    modulo(divisor: UInt256): UInt256 {
        const b = divisor.raw();

        if (b.isZero()) {
            throw new Error('Division by zero in modulo');
        }
        
        const remainder = this.raw().mod(b);
        return UInt256.fromRaw(remainder);
    }

    /**
     * Compare: -1 if this < other, 0 if equal, +1 if this > other.
     */
    compare(other: UInt256): -1 | 0 | 1 {
        const aRaw = this.raw();
        const bRaw = other.raw();
        return aRaw.cmp(bRaw) as -1 | 0 | 1;
    }

    equals(other: UInt256): boolean {
        return this.compare(other) === 0;
    }

    greaterThan(other: UInt256): boolean {
        return this.compare(other) > 0;
    }

    lessThan(other: UInt256): boolean {
        return this.compare(other) < 0;
    }

    private static u128ToBN(u128: UInt128): BN {
        // Access the raw bytes in LE
        const bytes = u128.byteArray; 
        return new BN(bytes, 'le');
    }
}

export type VarIntType = VarInt | IntType;
export class VarInt extends Int {
    static abiName = 'varint32';
    static byteWidth = 32;
    static isSigned = true;

    static fromABI(decoder: ABIDecoder) {
        return new this(new BN(decoder.readVarint32()));
    }

    toABI(encoder: ABIEncoder) {
        encoder.writeVarint32(Number(this));
    }
}
export type VarUIntType = VarUInt | IntType;
export class VarUInt extends Int {
    static abiName = 'varuint32';
    static byteWidth = 32;
    static isSigned = false;

    static fromABI(decoder: ABIDecoder) {
        return new this(new BN(decoder.readVaruint32()));
    }

    toABI(encoder: ABIEncoder) {
        encoder.writeVaruint32(Number(this));
    }
}

export type AnyInt =
    | Int8Type
    | Int16Type
    | Int32Type
    | Int64Type
    | Int128Type
    | UInt8Type
    | UInt16Type
    | UInt32Type
    | UInt64Type
    | UInt128Type
    | UInt256Type
    | VarIntType
    | VarUIntType;

/** Clamp number between min and max. */
function clamp(num: BN, min: BN, max: BN) {
    return BN.min(BN.max(num, min), max);
}

/**
 * Create new BN with the same bit pattern as the passed value,
 * extending or truncating the value’s representation as necessary.
 */
function truncate(value: BN, from: IntDescriptor, to: IntDescriptor): BN {
    const fill = value.isNeg() ? 255 : 0;
    const fromValue = from.isSigned ? value.toTwos(from.byteWidth * 8) : value;
    const fromBytes = fromValue.toArrayLike(Uint8Array as any, 'le') as Uint8Array;
    const toBytes = new Uint8Array(to.byteWidth);
    toBytes.fill(fill);
    toBytes.set(fromBytes.slice(0, to.byteWidth));
    const toValue = new BN(toBytes, undefined, 'le');
    return to.isSigned ? toValue.fromTwos(to.byteWidth * 8) : toValue;
}

/** C++11 implicit integer conversions. */
function convert(a: Int, b: Int) {
    // The integral promotions (4.5) shall be performed on both operands.
    a = promote(a);
    b = promote(b);

    const aType = a.constructor as typeof Int;
    const bType = b.constructor as typeof Int;

    // If both operands have the same type, no further conversion is needed
    if (aType !== bType) {
        // Otherwise, if both operands have signed integer types or both have unsigned integer types,
        // the operand with the type of lesser integer conversion rank shall be converted to the type
        // of the operand with greater rank.
        if (aType.isSigned === bType.isSigned) {
            if (aType.byteWidth > bType.byteWidth) {
                b = b.cast(aType);
            } else if (bType.byteWidth > aType.byteWidth) {
                a = a.cast(bType);
            }
        } else {
            // Otherwise, if the operand that has unsigned integer type has rank greater than or equal
            // to the rank of the type of the other operand, the operand with signed integer type
            // shall be converted to the type of the operand with unsigned integer type.
            if (aType.isSigned === false && aType.byteWidth >= bType.byteWidth) {
                b = b.cast(aType);
            } else if (bType.isSigned === false && bType.byteWidth >= aType.byteWidth) {
                a = a.cast(bType);
            } else {
                // Otherwise, if the type of the operand with signed integer type can represent all of the
                // values of the type of the operand with unsigned integer type, the operand with unsigned
                // integer type shall be converted to the type of the operand with signed integer type.
                if (
                    aType.isSigned === true &&
                    aType.max.gte(bType.max) &&
                    aType.min.lte(bType.min)
                ) {
                    b = b.cast(aType);
                } else if (
                    bType.isSigned === true &&
                    bType.max.gte(aType.max) &&
                    bType.min.lte(aType.min)
                ) {
                    a = a.cast(bType);
                } else {
                    // Otherwise, both operands shall be converted to the unsigned integer type
                    // corresponding to the type of the operand with signed integer type.
                    // ---
                    // Dead code: this can't happen™ with the types we have.
                    // ---
                    // const signedType = aType.isSigned ? aType : bType
                    // let unsignedType: typeof Int
                    // switch (signedType.byteWidth) {
                    //     case 4:
                    //         unsignedType = UInt32
                    //         break
                    //     case 8:
                    //         unsignedType = UInt64
                    //         break
                    //     case 16:
                    //         unsignedType = UInt128
                    //         break
                    //     default:
                    //         throw new Error(
                    //             `No corresponding unsigned type for ${signedType.abiName}`
                    //         )
                    // }
                    // a = a.cast(unsignedType)
                    // b = b.cast(unsignedType)
                }
            }
        }
    }

    return {a, b};
}

/** C++11 integral promotion. */
function promote(n: Int) {
    // An rvalue of type char, signed char, unsigned char, short int, or
    // unsigned short int can be converted to an rvalue of type int if int
    // can represent all the values of the source type; otherwise, the source
    // rvalue can be converted to an rvalue of type unsigned int.
    let rv = n;
    const type = n.constructor as typeof Int;

    if (type.byteWidth < 4) {
        rv = n.cast(Int32);
    }

    return rv;
}
