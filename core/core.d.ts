/**
 * @wire-sdk/core v1.1.0
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
import BN from 'bn.js';

interface BuiltinTypes {
    string: string;
    'string?'?: string;
    'string[]': string[];
    'string[]?'?: string[];
    bool: boolean;
    'bool?'?: boolean;
    'bool[]': boolean[];
    'bool[]?'?: boolean[];
    asset: Asset;
    'asset?'?: Asset;
    'asset[]': Asset[];
    'asset[]?'?: Asset[];
    extended_asset: ExtendedAsset;
    'extended_asset?'?: ExtendedAsset;
    'extended_asset[]': ExtendedAsset[];
    'extended_asset[]?'?: ExtendedAsset[];
    bytes: Bytes;
    'bytes?'?: Bytes;
    'bytes[]': Bytes[];
    'bytes[]?'?: Bytes[];
    checksum160: Checksum160;
    'checksum160?'?: Checksum160;
    'checksum160[]': Checksum160[];
    'checksum160[]?'?: Checksum160[];
    checksum256: Checksum256;
    'checksum256?'?: Checksum256;
    'checksum256[]': Checksum256[];
    'checksum256[]?'?: Checksum256[];
    checksum512: Checksum512;
    'checksum512?'?: Checksum512;
    'checksum512[]': Checksum512[];
    'checksum512[]?'?: Checksum512[];
    name: Name;
    'name?'?: Name;
    'name[]': Name[];
    'name[]?'?: Name[];
    publickey: PublicKey;
    'publickey?'?: PublicKey;
    'publickey[]': PublicKey[];
    'publickey[]?'?: PublicKey[];
    signature: Signature;
    'signature?'?: Signature;
    'signature[]': Signature[];
    'signature[]?'?: Signature[];
    symbol: Asset.Symbol;
    'symbol?'?: Asset.Symbol;
    'symbol[]': Asset.Symbol[];
    'symbol[]?'?: Asset.Symbol[];
    symbol_code: Asset.SymbolCode;
    'symbol_code?'?: Asset.SymbolCode;
    'symbol_code[]': Asset.SymbolCode[];
    'symbol_code[]?'?: Asset.SymbolCode[];
    time_point: TimePoint;
    'time_point?'?: TimePoint;
    'time_point[]': TimePoint[];
    'time_point[]?'?: TimePoint[];
    time_point_sec: TimePointSec;
    'time_point_sec?'?: TimePointSec;
    'time_point_sec[]': TimePointSec[];
    'time_point_sec[]?'?: TimePointSec[];
    block_timestamp_type: BlockTimestamp;
    'block_timestamp_type?'?: BlockTimestamp;
    'block_timestamp_type[]': BlockTimestamp[];
    'block_timestamp_type[]?'?: BlockTimestamp[];
    int8: Int8;
    'int8?'?: Int8;
    'int8[]': Int8[];
    'int8[]?'?: Int8[];
    int16: Int16;
    'int16?'?: Int16;
    'int16[]': Int16[];
    'int16[]?'?: Int16[];
    int32: Int32;
    'int32?'?: Int32;
    'int32[]': Int32[];
    'int32[]?'?: Int32[];
    int64: Int64;
    'int64?'?: Int64;
    'int64[]': Int64[];
    'int64[]?'?: Int64[];
    int128: Int128;
    'int128?'?: Int128;
    'int128[]': Int128[];
    'int128[]?'?: Int128[];
    uint8: UInt8;
    'uint8?'?: UInt8;
    'uint8[]': UInt8[];
    'uint8[]?'?: UInt8[];
    uint16: UInt16;
    'uint16?'?: UInt16;
    'uint16[]': UInt16[];
    'uint16[]?'?: UInt16[];
    uint32: UInt32;
    'uint32?'?: UInt32;
    'uint32[]': UInt32[];
    'uint32[]?'?: UInt32[];
    uint64: UInt64;
    'uint64?'?: UInt64;
    'uint64[]': UInt64[];
    'uint64[]?'?: UInt64[];
    uint128: UInt128;
    'uint128?'?: UInt128;
    'uint128[]': UInt128[];
    'uint128[]?'?: UInt128[];
    varint: VarInt;
    'varint?'?: VarInt;
    'varint[]': VarInt[];
    'varint[]?'?: VarInt[];
    varuint: VarUInt;
    'varuint?'?: VarUInt;
    'varuint[]': VarUInt[];
    'varuint[]?'?: VarUInt[];
    float32: Float32;
    'float32?'?: Float32;
    'float32[]': Float32[];
    'float32[]?'?: Float32[];
    float64: Float64;
    'float64?'?: Float64;
    'float64[]': Float64[];
    'float64[]?'?: Float64[];
    float128: Float128;
    'float128?'?: Float128;
    'float128[]': Float128[];
    'float128[]?'?: Float128[];
}

/**
 * Antelope/EOSIO ABI Decoder
 */

interface DecodeArgsBase {
    abi?: ABIDef;
    data?: BytesType | ABIDecoder;
    json?: string;
    object?: any;
    customTypes?: ABISerializableConstructor[];
    /** Optional encoder metadata. */
    metadata?: Record<string, any>;
    /**
     * Binary extension handling, if set to true missing extensions will be initialized,
     * otherwise they will be set to null. Defaults to false.
     */
    strictExtensions?: boolean;
    /**
     * Set to ignore invalid UTF-8, otherwise an error will be thrown (default).
     */
    ignoreInvalidUTF8?: boolean;
}
interface TypedDecodeArgs<T extends ABISerializableType> extends DecodeArgsBase {
    type: T;
}
interface BuiltinDecodeArgs<T extends keyof BuiltinTypes> extends DecodeArgsBase {
    type: T;
}
interface UntypedDecodeArgs extends DecodeArgsBase {
    type: ABISerializableType;
}
declare function abiDecode<T extends keyof BuiltinTypes>(args: BuiltinDecodeArgs<T>): BuiltinTypes[T];
declare function abiDecode<T extends ABISerializableConstructor>(args: TypedDecodeArgs<T>): InstanceType<T>;
declare function abiDecode(args: UntypedDecodeArgs): ABISerializable;
declare class ABIDecoder {
    private array;
    static __className: string;
    private pos;
    private data;
    private textDecoder;
    /** User declared metadata, can be used to pass info to instances when decoding.  */
    metadata: Record<string, any>;
    constructor(array: Uint8Array, textDecoder?: TextDecoder);
    canRead(bytes?: number): boolean;
    private ensure;
    setPosition(pos: number): void;
    getPosition(): number;
    advance(bytes: number): void;
    /** Read one byte. */
    readByte(): number;
    /** Read floating point as JavaScript number, 32 or 64 bits. */
    readFloat(byteWidth: number): number;
    readVaruint32(): number;
    readVarint32(): number;
    readArray(length: number): Uint8Array;
    readString(): string;
}

/**
 * Antelope/EOSIO ABI Encoder
 */

interface EncodeArgsBase {
    /**
     * ABI definition to use when encoding.
     */
    abi?: ABIDef;
    /**
     * Additional types to use when encoding, can be used to pass type constructors
     * that should be used when encountering a custom type.
     */
    customTypes?: ABISerializableConstructor[];
    /**
     * Can be passed to use a custom ABIEncoder instance.
     */
    encoder?: ABIEncoder;
    /**
     * Optional metadata to pass to the encoder.
     */
    metadata?: Record<string, any>;
}
interface EncodeArgsUntyped extends EncodeArgsBase {
    /**
     * Object to encode, either a object conforming to `ABISerializable`
     * or a JavaScript object, when the latter is used an the `type`
     * argument must also be set.
     */
    object: any;
    /**
     * Type to use when encoding the given object, either a type constructor
     * or a string name of a builtin type or a custom type in the given `abi`.
     */
    type: ABISerializableType;
}
interface EncodeArgsSerializable extends EncodeArgsBase {
    /**
     * Object conforming to `ABISerializable` to be encoded.
     */
    object: ABISerializable;
    /**
     * Optional type-override for given serializable object.
     */
    type?: ABISerializableType;
}
type EncodeArgs = EncodeArgsSerializable | EncodeArgsUntyped;
declare function abiEncode(args: EncodeArgs): Bytes;
declare class ABIEncoder {
    private pageSize;
    static __className: string;
    private pos;
    private data;
    private array;
    private textEncoder;
    /** User declared metadata, can be used to pass info to instances when encoding.  */
    metadata: Record<string, any>;
    constructor(pageSize?: number);
    private ensure;
    /** Write a single byte. */
    writeByte(byte: number): void;
    /** Write an array of bytes. */
    writeArray(bytes: ArrayLike<number>): void;
    writeFloat(value: number, byteWidth: number): void;
    writeVaruint32(v: number): void;
    writeVarint32(v: number): void;
    writeString(v: string): void;
    getData(): Uint8Array;
    getBytes(): Bytes;
}

/** A self-describing object that can be ABI encoded and decoded. */
type ABISerializable = ABISerializableObject | string | boolean | ABISerializable[] | {
    [key: string]: ABISerializable;
};
/** Type describing an ABI type, either a string (e.g. `uint32[]`) or a ABI type class. */
type ABISerializableType = string | ABISerializableConstructor | ABITypeDescriptor;
/** Interface that should be implemented by ABI serializable objects. */
interface ABISerializableObject {
    /** Called when encoding to binary abi format. */
    toABI?(encoder: ABIEncoder): void;
    /** Called when encoding to json abi format. */
    toJSON(): any;
    /** Return true if the object equals the other object passed. */
    equals(other: any): boolean;
}
interface ABITypeModifiers {
    /** Type is optional, defaults to false. */
    optional?: boolean;
    /** Type is an array, defaults to false. */
    array?: boolean;
    /** Type is a binary extension, defaults to false. */
    extension?: boolean;
}
interface ABITypeDescriptor extends ABITypeModifiers {
    /** Type name or class. */
    type: ABISerializableConstructor | string;
}
interface ABIField extends ABITypeDescriptor {
    /** Field name. */
    name: string;
}
interface ABISerializableConstructor {
    /** Name of the type, e.g. `asset`. */
    abiName: string;
    /** For structs, the fields that this type contains. */
    abiFields?: ABIField[];
    /** For structs, the base class this type extends. */
    abiBase?: ABISerializableConstructor;
    /** For variants, the different types this type can represent. */
    abiVariant?: ABITypeDescriptor[];
    /** Alias to another type. */
    abiAlias?: ABITypeDescriptor;
    /** Return value to use when creating a new instance of this type, used when decoding binary extensions. */
    abiDefault?: () => ABISerializable;
    /**
     * Create new instance from JavaScript object.
     * Should also accept an instance of itself and return that unchanged.
     */
    from(value: any): ABISerializable;
    /**
     * Create instance from binary ABI data.
     * @param decoder Decoder instance to read from.
     */
    fromABI?(decoder: ABIDecoder): ABISerializable;
    /**
     * Static ABI encoding can be used to encode non-class types.
     * Will be used in favor of instance.toABI if both exists.
     * @param value The value to encode.
     * @param encoder The encoder to write the value to.
     */
    toABI?(value: any, encoder: ABIEncoder): void;
    /**
     * Create a new instance, don't use this other than from a custom `from` factory method.
     * @internal
     */
    new (...args: any[]): ABISerializableObject;
}

type BlobType = Blob | string;
declare class Blob implements ABISerializableObject {
    static abiName: string;
    /**
     * Create a new Blob instance.
     */
    static from(value: BlobType): Blob;
    static fromString(value: string): Blob;
    readonly array: Uint8Array;
    constructor(array: Uint8Array);
    equals(other: BlobType): boolean;
    get base64String(): string;
    /** UTF-8 string representation of this instance. */
    get utf8String(): string;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
}

type BytesType = Bytes | ArrayBufferView | ArrayBuffer | ArrayLike<number> | string;
type AnyBytes = BytesType | {
    array: Uint8Array;
};
type BytesEncoding = 'hex' | 'utf8';
declare class Bytes implements ABISerializableObject {
    static abiName: string;
    /**
     * Create a new Bytes instance.
     * @note Make sure to take a [[copy]] before mutating the bytes as the underlying source is not copied here.
     */
    static from(value: AnyBytes, encoding?: BytesEncoding): Bytes;
    static fromString(value: string, encoding?: BytesEncoding): Bytes;
    static fromABI(decoder: ABIDecoder): Bytes;
    static abiDefault(): Bytes;
    static equal(a: BytesType, b: BytesType): boolean;
    static random(length: number): Bytes;
    /** Return true if given value is a valid `BytesType`. */
    static isBytes(value: any): value is BytesType;
    array: Uint8Array;
    constructor(array?: Uint8Array);
    /** Number of bytes in this instance. */
    get length(): number;
    /** Hex string representation of this instance. */
    get hexString(): string;
    /** UTF-8 string representation of this instance. */
    get utf8String(): string;
    /** Mutating. Append bytes to this instance. */
    append(other: AnyBytes): void;
    /** Non-mutating, returns a copy of this instance with appended bytes. */
    appending(other: AnyBytes): Bytes;
    /** Mutating. Pad this instance to length. */
    zeropad(n: number, truncate?: boolean): void;
    /** Non-mutating, returns a copy of this instance with zeros padded. */
    zeropadded(n: number, truncate?: boolean): Bytes;
    /** Mutating. Drop bytes from the start of this instance. */
    dropFirst(n?: number): void;
    /** Non-mutating, returns a copy of this instance with dropped bytes from the start. */
    droppingFirst(n?: number): Bytes;
    copy(): Bytes;
    equals(other: AnyBytes): boolean;
    toString(encoding?: BytesEncoding): string;
    toABI(encoder: ABIEncoder): void;
    toJSON(): string;
}

type ChecksumType = Checksum | BytesType;
declare class Checksum implements ABISerializableObject {
    static abiName: string;
    static byteSize: number;
    static from<T extends typeof Checksum>(this: T, value: ChecksumType): InstanceType<T>;
    static from(value: ChecksumType): unknown;
    static fromABI<T extends typeof Checksum>(this: T, decoder: ABIDecoder): InstanceType<T>;
    static fromABI(decoder: ABIDecoder): unknown;
    static abiDefault<T extends typeof Checksum>(this: T): InstanceType<T>;
    static abiDefault(): unknown;
    readonly array: Uint8Array;
    constructor(array: Uint8Array);
    equals(other: Checksum160Type | Checksum256Type | Checksum512Type): boolean;
    get hexString(): string;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
}
type Checksum256Type = Checksum256 | BytesType;
declare class Checksum256 extends Checksum {
    static abiName: string;
    static byteSize: number;
    static from(value: Checksum256Type): Checksum256;
    static hash(data: BytesType): Checksum256;
}
type Checksum512Type = Checksum512 | BytesType;
declare class Checksum512 extends Checksum {
    static abiName: string;
    static byteSize: number;
    static from(value: Checksum512Type): Checksum512;
    static hash(data: BytesType): Checksum512;
}
type Checksum160Type = Checksum160 | BytesType;
declare class Checksum160 extends Checksum {
    static abiName: string;
    static byteSize: number;
    static from(value: Checksum160Type): Checksum160;
    static hash(data: BytesType): Checksum160;
}

/** Supported Wire curve types. */
declare enum KeyType {
    K1 = "K1",
    R1 = "R1",
    WA = "WA",
    EM = "EM"
}
declare namespace KeyType {
    function indexFor(value: KeyType): 0 | 2 | 1 | 3;
    function from(value: number | string): KeyType;
}

type IntType = Int | number | string | BN;
/**
 * How to handle integer overflow.
 * - `throw`: Throws an error if value overflows (or underflows).
 * - `truncate`: Truncates or extends bit-pattern with sign extension (C++11 behavior).
 * - `clamp`: Clamps the value within the supported range.
 */
type OverflowBehavior = 'throw' | 'truncate' | 'clamp';
/**
 * How to handle remainder when dividing integers.
 * - `floor`: Round down to nearest integer.
 * - `round`: Round to nearest integer.
 * - `ceil`: Round up to nearest integer.
 */
type DivisionBehavior = 'floor' | 'round' | 'ceil';
/**
 * Binary integer with the underlying value represented by a BN.js instance.
 * Follows C++11 standard for arithmetic operators and conversions.
 * @note This type is optimized for correctness not speed, if you plan to manipulate
 *       integers in a tight loop you're advised to use the underlying BN.js value or
 *       convert to a JavaScript number first.
 */
declare class Int implements ABISerializableObject {
    static abiName: string;
    static isSigned: boolean;
    static byteWidth: number;
    /** Largest value that can be represented by this integer type. */
    static get max(): BN;
    /** Smallest value that can be represented by this integer type. */
    static get min(): BN;
    /** Add `lhs` to `rhs` and return the resulting value. */
    static add(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /** Add `lhs` to `rhs` and return the resulting value. */
    static sub(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /** Multiply `lhs` by `rhs` and return the resulting value. */
    static mul(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /**
     * Divide `lhs` by `rhs` and return the quotient, dropping the remainder.
     * @throws When dividing by zero.
     */
    static div(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded to the closest integer.
     * @throws When dividing by zero.
     */
    static divRound(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded up to the closest integer.
     * @throws When dividing by zero.
     */
    static divCeil(lhs: Int, rhs: Int, overflow?: OverflowBehavior): Int;
    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than `rhs`. */
    static gt(lhs: Int, rhs: Int): boolean;
    /** Compare `lhs` to `rhs` and return true if `lhs` is less than `rhs`. */
    static lt(lhs: Int, rhs: Int): boolean;
    /** Compare `lhs` to `rhs` and return true if `lhs` is greater than or equal to `rhs`. */
    static gte(lhs: Int, rhs: Int): boolean;
    /** Compare `lhs` to `rhs` and return true if `lhs` is less than or equal to `rhs`. */
    static lte(lhs: Int, rhs: Int): boolean;
    /**
     * Can be used to implement custom operator.
     * @internal
     */
    static operator(lhs: Int, rhs: Int, overflow: OverflowBehavior | undefined, fn: (lhs: BN, rhs: BN) => BN): Int;
    /**
     * Create a new instance from value.
     * @param value Value to create new Int instance from, can be a string, number,
     *              little-endian byte array or another Int instance.
     * @param overflow How to handle integer overflow, default behavior is to throw.
     */
    static from<T extends typeof Int>(this: T, value: IntType | Uint8Array, overflow?: OverflowBehavior): InstanceType<T>;
    static from(value: any, overflow?: OverflowBehavior): unknown;
    static fromABI<T extends typeof Int>(this: T, decoder: ABIDecoder): InstanceType<T>;
    static fromABI(decoder: ABIDecoder): unknown;
    static abiDefault(): Int;
    static random<T extends typeof Int>(this: T): InstanceType<T>;
    static random(): unknown;
    /**
     * The underlying BN.js instance – don't modify this
     * directly – take a copy first using `.clone()`.
     */
    value: BN;
    /**
     * Create a new instance, don't use this directly. Use the `.from` factory method instead.
     * @throws If the value over- or under-flows the integer type.
     */
    constructor(value: BN);
    /**
     * Cast this integer to other type.
     * @param overflow How to handle overflow, default is to preserve bit-pattern (C++11 behavior).
     */
    cast<T extends typeof Int>(type: T, overflow?: OverflowBehavior): InstanceType<T>;
    /** Number as bytes in little endian (matches memory layout in C++ contract). */
    get byteArray(): Uint8Array;
    /**
     * Compare two integers, if strict is set to true the test will only consider integers
     * of the exact same type. I.e. Int64.from(1).equals(UInt64.from(1)) will return false.
     */
    equals(other: IntType | Uint8Array, strict?: boolean): boolean;
    /** Mutating add. */
    add(num: IntType): void;
    /** Non-mutating add. */
    adding(num: IntType): this;
    /** Mutating subtract. */
    subtract(num: IntType): void;
    /** Non-mutating subtract. */
    subtracting(num: IntType): this;
    /** Mutating multiply. */
    multiply(by: IntType): void;
    /** Non-mutating multiply. */
    multiplying(by: IntType): this;
    /**
     * Mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    divide(by: IntType, behavior?: DivisionBehavior): void;
    /**
     * Non-mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    dividing(by: IntType, behavior?: DivisionBehavior): this;
    /** Greater than comparision operator */
    gt(other: Int): boolean;
    /** Less than comparision operator */
    lt(other: Int): boolean;
    /** Greater than or equal comparision operator */
    gte(other: Int): boolean;
    /** Less than or equal comparision operator */
    lte(other: Int): boolean;
    /**
     * Run operator with C++11 implicit conversion.
     * @internal
     */
    private operator;
    /**
     * Convert to a JavaScript number.
     * @throws If the number cannot be represented by 53-bits.
     **/
    toNumber(): number;
    toString(): string;
    [Symbol.toPrimitive](type: string): string | number;
    toABI(encoder: ABIEncoder): void;
    toJSON(): string | number;
}
type Int8Type = Int8 | IntType;
declare class Int8 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type Int16Type = Int16 | IntType;
declare class Int16 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type Int32Type = Int32 | IntType;
declare class Int32 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type Int64Type = Int64 | IntType;
declare class Int64 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type Int128Type = Int128 | IntType;
declare class Int128 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type UInt8Type = UInt8 | IntType;
declare class UInt8 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type UInt16Type = UInt16 | IntType;
declare class UInt16 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type UInt32Type = UInt32 | IntType;
declare class UInt32 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type UInt64Type = UInt64 | IntType;
declare class UInt64 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type UInt128Type = UInt128 | IntType;
declare class UInt128 extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
}
type VarIntType = VarInt | IntType;
declare class VarInt extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
    static fromABI(decoder: ABIDecoder): VarInt;
    toABI(encoder: ABIEncoder): void;
}
type VarUIntType = VarUInt | IntType;
declare class VarUInt extends Int {
    static abiName: string;
    static byteWidth: number;
    static isSigned: boolean;
    static fromABI(decoder: ABIDecoder): VarUInt;
    toABI(encoder: ABIEncoder): void;
}
type AnyInt = Int8Type | Int16Type | Int32Type | Int64Type | Int128Type | UInt8Type | UInt16Type | UInt32Type | UInt64Type | UInt128Type | VarIntType | VarUIntType;

interface StructConstructor extends ABISerializableConstructor {
    new <T extends Struct>(...args: any[]): T;
    structFields: ABIField[];
}
declare class Struct implements ABISerializableObject {
    static abiName: string;
    static abiFields: ABIField[];
    static abiBase: ABISerializableConstructor;
    static from<T extends StructConstructor>(this: T, value: any): InstanceType<T>;
    static from(value: any): unknown;
    static get structFields(): ABIField[];
    /** @internal */
    constructor(object: any);
    /**
     * Return true if this struct equals the other.
     *
     * Note: This compares the ABI encoded bytes of both structs, subclasses
     *       should implement their own fast equality check when possible.
     */
    equals(other: any): boolean;
    /** @internal */
    toJSON(): any;
}
declare namespace Struct {
    function type(name: string): <T extends StructConstructor>(struct: T) => T;
    function field(type: ABISerializableConstructor | string, options?: ABITypeModifiers): <T extends Struct>(target: T, name: string) => void;
}

declare function TypeAlias(name: string): (typeAlias: any) => any;

interface VariantConstructor extends ABISerializableConstructor {
    new <T extends Variant>(...args: any[]): T;
}
type AnyVariant = Variant | ABISerializable | [string, any];
declare class Variant implements ABISerializableObject {
    static abiName: string;
    static abiVariant: ABITypeDescriptor[];
    static from<T extends VariantConstructor>(this: T, object: AnyVariant): InstanceType<T>;
    static from(object: AnyVariant): unknown;
    value: ABISerializable;
    variantIdx: number;
    /** @internal */
    constructor(variant: [string, ABISerializable]);
    /**
     * Return true if this variant equals the other.
     *
     * Note: This compares the ABI encoded bytes of both variants, subclasses
     *       should implement their own fast equality check when possible.
     */
    equals(other: AnyVariant): boolean;
    get variantName(): string;
    /** @internal */
    toJSON(): ABISerializable[];
}
declare namespace Variant {
    function type(name: string, types: ABISerializableType[]): <T extends VariantConstructor>(variant: T) => T;
}

type FloatType = Float | number | string;
declare class Float implements ABISerializableObject {
    static abiName: string;
    static byteWidth: number;
    static from<T extends typeof Float>(this: T, value: FloatType): InstanceType<T>;
    static from(value: FloatType): unknown;
    static fromABI<T extends typeof Float>(this: T, decoder: ABIDecoder): InstanceType<T>;
    static fromABI(decoder: ABIDecoder): unknown;
    static abiDefault(): Float;
    static random<T extends typeof Float>(this: T): InstanceType<T>;
    static random(): unknown;
    value: number;
    constructor(value: number);
    equals(other: FloatType): boolean;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
}
type Float32Type = Float32 | FloatType;
declare class Float32 extends Float {
    static abiName: string;
    static byteWidth: number;
    toString(): string;
}
type Float64Type = Float64 | FloatType;
declare class Float64 extends Float {
    static abiName: string;
    static byteWidth: number;
}
type Float128Type = Float128 | BytesType;
declare class Float128 implements ABISerializableObject {
    static abiName: string;
    static byteWidth: number;
    static from(value: Float128Type): Float128;
    static fromABI(decoder: ABIDecoder): Float128;
    static random(): Float128;
    data: Bytes;
    constructor(data: Bytes);
    equals(other: Float128Type): boolean;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
}

/** Type representing a name. */
type NameType = Name | UInt64 | string;
/** Antelope/EOSIO Name */
declare class Name implements ABISerializableObject {
    static abiName: string;
    /** Regex pattern matching a Antelope/EOSIO name, case-sensitive. */
    static pattern: RegExp;
    /** The numeric representation of the name. */
    value: UInt64;
    /**
     * The raw representation of the name.
     * @deprecated Use value instead.
     */
    get rawValue(): UInt64;
    /** Create a new Name instance from any of its representing types. */
    static from(value: NameType): Name;
    static fromABI(decoder: ABIDecoder): Name;
    static abiDefault(): Name;
    constructor(value: UInt64);
    /** Return true if this name is equal to passed name. */
    equals(other: NameType): boolean;
    /** Return string representation of this name. */
    toString(): string;
    toABI(encoder: ABIEncoder): void;
    /** @internal */
    toJSON(): string;
}

type TimePointType = TimePoint | TimePointSec | string | Date | AnyInt;
interface TimePointConstructor {
    from(value: TimePointType): TimePointBase;
    fromInteger(value: AnyInt): TimePointBase;
    fromDate(value: Date): TimePointBase;
    fromString(value: string): TimePointBase;
    fromMilliseconds(value: number): TimePointBase;
    new (...args: any[]): TimePointBase;
}
declare class TimePointBase implements ABISerializableObject {
    static abiName: string;
    static from<T extends TimePointConstructor>(this: T, value: TimePointType): InstanceType<T>;
    static from(value: TimePointType): unknown;
    static fromString<T extends TimePointConstructor>(this: T, string: string): InstanceType<T>;
    static fromString(string: string): unknown;
    static fromDate<T extends TimePointConstructor>(this: T, date: Date): InstanceType<T>;
    static fromDate(date: Date): unknown;
    static abiDefault<T extends TimePointConstructor>(this: T): InstanceType<T>;
    toABI(encoder: ABIEncoder): void;
    equals(other: TimePointType): boolean;
    toMilliseconds(): number;
    toDate(): Date;
    toJSON(): string;
}
/** Timestamp with microsecond accuracy. */
declare class TimePoint extends TimePointBase {
    static abiName: string;
    static fromMilliseconds(ms: number): TimePoint;
    static fromInteger(value: Int64Type): TimePoint;
    static fromABI(decoder: ABIDecoder): TimePoint;
    value: Int64;
    constructor(value: Int64);
    toString(): string;
    toMilliseconds(): number;
}
/** Timestamp with second accuracy. */
declare class TimePointSec extends TimePointBase {
    static abiName: string;
    static fromMilliseconds(ms: number): TimePointSec;
    static fromInteger(value: UInt32Type): TimePointSec;
    static fromABI(decoder: ABIDecoder): TimePointSec;
    value: UInt32;
    constructor(value: UInt32);
    toString(): string;
    toMilliseconds(): number;
}
declare class BlockTimestamp extends TimePointBase {
    static abiName: string;
    static fromMilliseconds(ms: number): BlockTimestamp;
    static fromInteger(value: UInt32Type): BlockTimestamp;
    static fromABI(decoder: ABIDecoder): BlockTimestamp;
    value: UInt32;
    constructor(value: UInt32);
    toString(): string;
    toMilliseconds(): number;
}

type ABIDef = string | Partial<ABI.Def> | ABI | Blob;
declare class ABI implements ABISerializableObject {
    static abiName: string;
    static version: string;
    version: string;
    types: ABI.TypeDef[];
    variants: ABI.Variant[];
    structs: ABI.Struct[];
    actions: ABI.Action[];
    tables: ABI.Table[];
    ricardian_clauses: ABI.Clause[];
    action_results: ABI.ActionResult[];
    constructor(args: Partial<ABI.Def>);
    static from(value: ABIDef): ABI;
    static fromABI(decoder: ABIDecoder): ABI;
    toABI(encoder: ABIEncoder): void;
    resolveType(name: string): ABI.ResolvedType;
    resolveAll(): {
        types: ABI.ResolvedType[];
        variants: ABI.ResolvedType[];
        structs: ABI.ResolvedType[];
    };
    private resolve;
    getStruct(name: string): ABI.Struct | undefined;
    getVariant(name: string): ABI.Variant | undefined;
    /** Return arguments type of an action in this ABI. */
    getActionType(actionName: NameType): string | undefined;
    equals(other: ABIDef): boolean;
    toJSON(): {
        version: string;
        types: ABI.TypeDef[];
        structs: ABI.Struct[];
        actions: ABI.Action[];
        tables: ABI.Table[];
        ricardian_clauses: ABI.Clause[];
        error_messages: never[];
        abi_extensions: never[];
        variants: ABI.Variant[];
        action_results: ABI.ActionResult[];
    };
}
declare namespace ABI {
    interface TypeDef {
        new_type_name: string;
        type: string;
    }
    interface Field {
        name: string;
        type: string;
    }
    interface Struct {
        name: string;
        base: string;
        fields: Field[];
    }
    interface Action {
        name: NameType;
        type: string;
        ricardian_contract: string;
    }
    interface Table {
        name: NameType;
        index_type: string;
        key_names: string[];
        key_types: string[];
        type: string;
    }
    interface Clause {
        id: string;
        body: string;
    }
    interface Variant {
        name: string;
        types: string[];
    }
    interface Def {
        version: string;
        types: TypeDef[];
        variants: Variant[];
        structs: Struct[];
        actions: Action[];
        tables: Table[];
        ricardian_clauses: Clause[];
        action_results: ActionResult[];
    }
    interface ActionResult {
        name: NameType;
        result_type: string;
    }
    class ResolvedType {
        name: string;
        id: number;
        isArray: boolean;
        isOptional: boolean;
        isExtension: boolean;
        base?: ResolvedType;
        fields?: {
            name: string;
            type: ResolvedType;
        }[];
        variant?: ResolvedType[];
        ref?: ResolvedType;
        constructor(fullName: string, id?: number);
        /**
         * Type name including suffixes: [] array, ? optional, $ binary ext
         */
        get typeName(): string;
        /** All fields including base struct(s), undefined if not a struct type. */
        get allFields(): {
            name: string;
            type: ResolvedType;
        }[] | undefined;
    }
}

type AssetType = Asset | string;
declare class Asset implements ABISerializableObject {
    static abiName: string;
    units: Int64;
    symbol: Asset.Symbol;
    static from(value: AssetType): Asset;
    static from(value: number, symbol: Asset.SymbolType): Asset;
    static fromString(value: string): Asset;
    static fromFloat(value: number, symbol: Asset.SymbolType): Asset;
    static fromUnits(value: Int64Type, symbol: Asset.SymbolType): Asset;
    static fromABI(decoder: ABIDecoder): Asset;
    static abiDefault(): Asset;
    static formatUnits(units: Int64Type, precision: number): string;
    constructor(units: Int64, symbol: Asset.Symbol);
    equals(other: AssetType): boolean;
    get value(): number;
    set value(newValue: number);
    get quantity(): string;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
}
declare namespace Asset {
    type SymbolType = Symbol | UInt64 | string;
    class Symbol implements ABISerializableObject {
        static abiName: string;
        static maxPrecision: number;
        static from(value: SymbolType): Symbol;
        static fromParts(name: string, precision: number): Symbol;
        static fromABI(decoder: ABIDecoder): Symbol;
        static abiDefault(): Symbol;
        value: UInt64;
        constructor(value: UInt64);
        equals(other: SymbolType): boolean;
        get name(): string;
        get precision(): number;
        get code(): SymbolCode;
        toABI(encoder: ABIEncoder): void;
        /**
         * Convert units to floating point number according to symbol precision.
         * @throws If the given units can't be represented in 53 bits.
         **/
        convertUnits(units: Int64): number;
        /**
         * Convert floating point to units according to symbol precision.
         * Note that the value will be rounded to closest precision.
         **/
        convertFloat(float: number): Int64;
        toString(): string;
        toJSON(): string;
    }
    type SymbolCodeType = SymbolCode | UInt64 | string | number;
    class SymbolCode implements ABISerializableObject {
        static abiName: string;
        static pattern: RegExp;
        static from(value: SymbolCodeType): SymbolCode;
        static fromABI(decoder: ABIDecoder): SymbolCode;
        static abiDefault(): SymbolCode;
        value: UInt64;
        constructor(value: UInt64);
        equals(other: SymbolCodeType): boolean;
        toABI(encoder: ABIEncoder): void;
        toString(): string;
        toJSON(): string;
    }
}
type ExtendedAssetType = ExtendedAsset | {
    quantity: AssetType;
    contract: NameType;
};
declare class ExtendedAsset implements ABISerializableObject {
    static abiName: string;
    static from(value: ExtendedAssetType): ExtendedAsset;
    static fromABI(decoder: ABIDecoder): ExtendedAsset;
    quantity: Asset;
    contract: Name;
    constructor(quantity: Asset, contract: Name);
    equals(other: ExtendedAssetType): boolean;
    toABI(encoder: ABIEncoder): void;
    toJSON(): {
        quantity: Asset;
        contract: Name;
    };
}
type ExtendedSymbolType = ExtendedSymbol | {
    sym: Asset.SymbolType;
    contract: NameType;
};
declare class ExtendedSymbol implements ABISerializableObject {
    static abiName: string;
    static from(value: ExtendedSymbolType): ExtendedSymbol;
    static fromABI(decoder: ABIDecoder): ExtendedSymbol;
    sym: Asset.Symbol;
    contract: Name;
    constructor(sym: Asset.Symbol, contract: Name);
    equals(other: ExtendedSymbolType): boolean;
    toABI(encoder: ABIEncoder): void;
    toJSON(): {
        sym: Asset.Symbol;
        contract: Name;
    };
}

type PublicKeyType = PublicKey | string | {
    type: string;
    compressed: Uint8Array;
};
declare class PublicKey implements ABISerializableObject {
    static abiName: string;
    /** Type, e.g. `K1` */
    type: KeyType;
    /** Compressed public key point. */
    data: Bytes;
    /** Create PublicKey object from representing types. */
    static from(value: PublicKeyType): PublicKey;
    /** @internal */
    static fromABI(decoder: ABIDecoder): PublicKey;
    /** @internal */
    constructor(type: KeyType, data: Bytes);
    equals(other: PublicKeyType): boolean;
    /**
     * Return Antelope/EOSIO legacy (`EOS<base58data>`) formatted key.
     * @throws If the key type isn't `K1` or 'EM'.
     */
    toLegacyString(prefix?: string): string;
    /** Return key in modern Antelope/EOSIO format (`PUB_<type>_<base58data>`) */
    toString(): string;
    /** @internal */
    toABI(encoder: ABIEncoder): void;
    /** @internal */
    toJSON(): string;
}

type SignatureType = Signature | string | {
    type: string;
    r: Uint8Array;
    s: Uint8Array;
    recid: number;
};
declare class Signature implements ABISerializableObject {
    static abiName: string;
    /** Type, e.g. `K1` */
    type: KeyType;
    /** Signature data. */
    data: Bytes;
    /** Create Signature object from representing types. */
    static from(value: SignatureType): Signature;
    /** @internal */
    static fromABI(decoder: ABIDecoder): Signature;
    /** @internal */
    constructor(type: KeyType, data: Bytes);
    equals(other: SignatureType): boolean;
    /** Recover public key from given message digest. */
    recoverDigest(digest: Checksum256Type): PublicKey;
    /** Recover public key from given message. */
    recoverMessage(message: BytesType): PublicKey;
    /** Verify this signature with given message digest and public key. */
    verifyDigest(digest: Checksum256Type, publicKey: PublicKey): boolean;
    /** Verify this signature with given message and public key. */
    verifyMessage(message: BytesType, publicKey: PublicKey): boolean;
    /** Base58check encoded string representation of this signature (`SIG_<type>_<data>`). */
    toString(): string;
    /** @internal */
    toABI(encoder: ABIEncoder): void;
    /** @internal */
    toJSON(): string;
}

type PrivateKeyType = PrivateKey | string;
declare class PrivateKey {
    type: KeyType;
    data: Bytes;
    /** Create PrivateKey object from representing types. */
    static from(value: PrivateKeyType): PrivateKey;
    /**
     * Create PrivateKey object from a string representation.
     * Accepts WIF (5...) and Antelope/EOSIO (PVT_...) style private keys.
     */
    static fromString(string: string, ignoreChecksumError?: boolean): PrivateKey;
    /**
     * Generate new PrivateKey.
     * @throws If a secure random source isn't available.
     */
    static generate(type: KeyType | string): PrivateKey;
    /** @internal */
    constructor(type: KeyType, data: Bytes);
    /**
     * Sign message digest using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signDigest(digest: Checksum256Type): Signature;
    /**
     * Sign message using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signMessage(message: BytesType): Signature;
    /**
     * Derive the shared secret between this private key and given public key.
     * @throws If the key type isn't R1 or K1.
     */
    sharedSecret(publicKey: PublicKey): Checksum512;
    /**
     * Get the corresponding public key.
     * @throws If the key type isn't R1 or K1.
     */
    toPublic(): PublicKey;
    /**
     * Return WIF representation of this private key
     * @throws If the key type isn't K1/EM.
     */
    toWif(): string;
    /**
     * Return the key in Antelope/EOSIO PVT_<type>_<base58check> format.
     */
    toString(): string;
    toJSON(): string;
}

type PermissionLevelType = PermissionLevel | {
    actor: NameType;
    permission: NameType;
};
/** Antelope/EOSIO Permission Level, a.k.a "auth". */
declare class PermissionLevel extends Struct {
    actor: Name;
    permission: Name;
    /** Create new permission level from representing types. Can be expressed as a string in the format `<actor>@<permission>`. */
    static from(value: PermissionLevelType | string): PermissionLevel;
    /** Return true if this permission level equals other. */
    equals(other: PermissionLevelType | string): boolean;
    toString(): string;
}

interface ActionBase {
    /** The account (a.k.a. contract) to run action on. */
    account: NameType;
    /** The name of the action. */
    name: NameType;
    /** The permissions authorizing the action. */
    authorization: PermissionLevelType[];
}
interface ActionFields extends ActionBase {
    /** The ABI-encoded action data. */
    data: BytesType;
}
/** Action type that may or may not have its data encoded */
interface AnyAction extends ActionBase {
    data: BytesType | ABISerializableObject | Record<string, any>;
}
type ActionType = Action | ActionFields;
declare class Action extends Struct {
    /** The account (a.k.a. contract) to run action on. */
    account: Name;
    /** The name of the action. */
    name: Name;
    /** The permissions authorizing the action. */
    authorization: PermissionLevel[];
    /** The ABI-encoded action data. */
    data: Bytes;
    abi?: ABI;
    static from(anyAction: ActionType | AnyAction, abi?: ABIDef): Action;
    /** Return true if this Action is equal to given action. */
    equals(other: ActionType | AnyAction): boolean;
    /** Return action data decoded as given type or using ABI. */
    decodeData<T extends ABISerializableConstructor>(type: T): InstanceType<T>;
    decodeData<T extends keyof BuiltinTypes>(type: T): BuiltinTypes[T];
    decodeData(abi: ABIDef): ABISerializable;
    get decoded(): any;
}

declare class TransactionExtension extends Struct {
    type: UInt16;
    data: Bytes;
}
interface TransactionHeaderFields {
    /** The time at which a transaction expires. */
    expiration: TimePointType;
    /** *Specifies a block num in the last 2^16 blocks. */
    ref_block_num: UInt16Type;
    /** Specifies the lower 32 bits of the block id. */
    ref_block_prefix: UInt32Type;
    /** Upper limit on total network bandwidth (in 8 byte words) billed for this transaction. */
    max_net_usage_words?: VarUIntType;
    /** Upper limit on the total CPU time billed for this transaction. */
    max_cpu_usage_ms?: UInt8Type;
    /** Number of seconds to delay this transaction for during which it may be canceled. */
    delay_sec?: VarUIntType;
}
type TransactionHeaderType = TransactionHeader | TransactionHeaderFields;
declare class TransactionHeader extends Struct {
    /** The time at which a transaction expires. */
    expiration: TimePointSec;
    /** *Specifies a block num in the last 2^16 blocks. */
    ref_block_num: UInt16;
    /** Specifies the lower 32 bits of the block id. */
    ref_block_prefix: UInt32;
    /** Upper limit on total network bandwidth (in 8 byte words) billed for this transaction. */
    max_net_usage_words: VarUInt;
    /** Upper limit on the total CPU time billed for this transaction. */
    max_cpu_usage_ms: UInt8;
    /** Number of seconds to delay this transaction for during which it may be canceled. */
    delay_sec: VarUInt;
    static from(object: TransactionHeaderType): TransactionHeader;
}
interface TransactionFields extends TransactionHeaderFields {
    /** The context free actions in the transaction. */
    context_free_actions?: ActionType[];
    /** The actions in the transaction. */
    actions?: ActionType[];
    /** Transaction extensions. */
    transaction_extensions?: {
        type: UInt16Type;
        data: BytesType;
    }[];
}
interface AnyTransaction extends TransactionHeaderFields {
    /** The context free actions in the transaction. */
    context_free_actions?: AnyAction[];
    /** The actions in the transaction. */
    actions?: AnyAction[];
    /** Transaction extensions. */
    transaction_extensions?: {
        type: UInt16Type;
        data: BytesType;
    }[];
}
type TransactionType = Transaction | TransactionFields;
declare class Transaction extends TransactionHeader {
    /** The context free actions in the transaction. */
    context_free_actions: Action[];
    /** The actions in the transaction. */
    actions: Action[];
    /** Transaction extensions. */
    transaction_extensions: TransactionExtension[];
    static from(object: TransactionType | AnyTransaction, abis?: ABIDef | {
        contract: NameType;
        abi: ABIDef;
    }[]): Transaction;
    /** Return true if this transaction is equal to given transaction. */
    equals(other: TransactionType): boolean;
    get id(): Checksum256;
    signingDigest(chainId: Checksum256Type): Checksum256;
    signingData(chainId: Checksum256Type): Bytes;
}
interface SignedTransactionFields extends TransactionFields {
    /** List of signatures. */
    signatures?: SignatureType[];
    /** Context-free action data, for each context-free action, there is an entry here. */
    context_free_data?: BytesType[];
}
type SignedTransactionType = SignedTransaction | SignedTransactionFields;
declare class SignedTransaction extends Transaction {
    /** List of signatures. */
    signatures: Signature[];
    /** Context-free action data, for each context-free action, there is an entry here. */
    context_free_data: Bytes[];
    /** The transaction without the signatures. */
    get transaction(): Transaction;
    get id(): Checksum256;
    static from(object: SignedTransactionType): SignedTransaction;
}
type PackedTransactionType = PackedTransaction | {
    signatures?: SignatureType[];
    compression?: UInt8Type;
    packed_context_free_data?: BytesType;
    packed_trx: BytesType;
};
declare enum CompressionType {
    none = 0,
    zlib = 1
}
declare class PackedTransaction extends Struct {
    signatures: Signature[];
    compression: UInt8;
    packed_context_free_data: Bytes;
    packed_trx: Bytes;
    static from(object: PackedTransactionType): PackedTransaction;
    static fromSigned(signed: SignedTransaction, compression?: CompressionType): PackedTransaction;
    getTransaction(): Transaction;
    getSignedTransaction(): SignedTransaction;
}
declare class TransactionReceipt extends Struct {
    status: string;
    cpu_usage_us: UInt32;
    net_usage_words: UInt32;
}

declare class Weight extends UInt16 {
}
declare class KeyWeight extends Struct {
    key: PublicKey;
    weight: Weight;
}
declare class PermissionLevelWeight extends Struct {
    permission: PermissionLevel;
    weight: Weight;
}
declare class WaitWeight extends Struct {
    wait_sec: UInt32;
    weight: Weight;
}
type AuthorityType = Authority | {
    threshold: UInt32Type;
    keys?: {
        key: PublicKeyType;
        weight: UInt16Type;
    }[];
    accounts?: {
        permission: PermissionLevelType;
        weight: UInt16Type;
    }[];
    waits?: {
        wait_sec: UInt32Type;
        weight: UInt16Type;
    }[];
};
declare class Authority extends Struct {
    threshold: UInt32;
    keys: KeyWeight[];
    accounts: PermissionLevelWeight[];
    waits: WaitWeight[];
    static from(value: AuthorityType): Authority;
    /** Total weight of all waits. */
    get waitThreshold(): number;
    /** Weight a key needs to sign for this authority. */
    get keyThreshold(): number;
    /** Return the weight for given public key, or zero if it is not included in this authority. */
    keyWeight(publicKey: PublicKeyType): number;
    /**
     * Check if given public key has permission in this authority,
     * @attention Does not take indirect permissions for the key via account weights into account.
     * @param publicKey The key to check.
     * @param includePartial Whether to consider auths where the key is included but can't be reached alone (e.g. multisig).
     */
    hasPermission(publicKey: PublicKeyType, includePartial?: boolean): boolean;
    /**
     * Sorts the authority weights in place, should be called before including the authority in a `updateauth` action or it might be rejected.
     */
    sort(): void;
}

declare namespace Serializer {
    const encode: typeof abiEncode;
    const decode: typeof abiDecode;
    /** Create an Antelope/EOSIO ABI definition for given core type. */
    function synthesize(type: ABISerializableConstructor): ABI;
    /** Create JSON representation of a core object. */
    function stringify(object: ABISerializable): string;
    /** Create a vanilla js representation of a core object. */
    function objectify(object: ABISerializable): any;
}

type BlockIdType = BlockId | BytesType | {
    blockNum: UInt32Type;
    checksum: Checksum256Type;
};
declare class BlockId implements ABISerializableObject {
    static abiName: string;
    static from(value: BlockIdType): BlockId;
    static fromABI(decoder: ABIDecoder): BlockId;
    static fromBlockChecksum(checksum: Checksum256Type, blockNum: UInt32Type): BlockId;
    readonly array: Uint8Array;
    constructor(array: Uint8Array);
    equals(other: BlockIdType): boolean;
    toABI(encoder: ABIEncoder): void;
    toString(): string;
    toJSON(): string;
    get hexString(): string;
    get blockNum(): UInt32;
}

declare namespace Base58 {
    enum ErrorCode {
        E_CHECKSUM = "E_CHECKSUM",
        E_INVALID = "E_INVALID"
    }
    class DecodingError extends Error {
        readonly code: ErrorCode;
        readonly info: Record<string, any>;
        static __className: string;
        constructor(message: string, code: ErrorCode, info?: Record<string, any>);
    }
    /** Decode a Base58 encoded string. */
    function decode(s: string, size?: number): Bytes;
    /** Decode a Base58Check encoded string. */
    function decodeCheck(encoded: string, size?: number): Bytes;
    /** Decode a Base58Check encoded string that uses ripemd160 instead of double sha256 for the digest. */
    function decodeRipemd160Check(encoded: string, size?: number, suffix?: string): Bytes;
    /** Encode bytes to a Base58 string.  */
    function encode(data: BytesType): string;
    function encodeCheck(data: BytesType): string;
    function encodeRipemd160Check(data: BytesType, suffix?: string): string;
}

declare function arrayEquals(a: ArrayLike<number>, b: ArrayLike<number>): boolean;
declare function arrayEquatableEquals(a: ABISerializableObject[], b: ABISerializableObject[]): boolean;
declare function arrayToHex(array: ArrayLike<number>): string;
declare function hexToArray(hex: string): Uint8Array;
/** Generate N random bytes, throws if a secure random source isn't available. */
declare function secureRandom(length: number): Uint8Array;
/** Check if object in instance of class. */
declare function isInstanceOf<T extends {
    new (...args: any[]): InstanceType<T>;
}>(object: any, someClass: T): object is InstanceType<T>;
/**
 * Given a hex string of an address, returns a valid wire name. Takes the first and last 4 bytes ( 8 characters from each end ) and converts them to a base32 string.
 *
 * Note: This implementation has a nearly impossible chance of collisions. Reference: https://vanity-eth.tk/
 *
 * @param address Hex formatted string of an address. '0x' prefix is optional, will be pruned.
 * @returns A valid Wire name generated from the address.
 */
declare function addressToWireName(address: string): string;

type Fetch$1 = (input: any, init?: any) => Promise<any>;
/** Response to an API call.  */
interface APIResponse {
    json?: any;
    text: string;
    status: number;
    headers: Record<string, string>;
}
interface APIProvider {
    /**
     * Call an API endpoint and return the response.
     * Provider is responsible for JSON encoding the params and decoding the response.
     * @argument path The endpoint path, e.g. `/v1/chain/get_info`
     * @argument params The request body if any.
     */
    call(args: {
        path: string;
        params?: unknown;
        method?: APIMethods;
    }): Promise<APIResponse>;
}
interface FetchProviderOptions {
    /**
     * Fetch instance, must be provided in non-browser environments.
     * You can use the node-fetch package in Node.js.
     */
    fetch?: Fetch$1;
    /**
     * Headers that will be applied to every request
     * */
    headers?: Record<string, string>;
}
/** Default provider that uses the Fetch API to call a single node. */
declare class FetchProvider implements APIProvider {
    readonly url: string;
    readonly fetch: Fetch$1;
    readonly headers: Record<string, string>;
    constructor(url: string, options?: FetchProviderOptions);
    call(args: {
        path: string;
        params?: unknown;
        method?: APIMethods;
        headers?: Record<string, string>;
    }): Promise<{
        headers: {};
        status: any;
        json: any;
        text: any;
    }>;
}

declare class AccountLinkedAction extends Struct {
    account: Name;
    action: Name;
}
declare class AccountPermission extends Struct {
    perm_name: Name;
    parent: Name;
    required_auth: Authority;
    linked_actions: AccountLinkedAction[];
}
declare class AccountResourceLimit extends Struct {
    used: Int64;
    available: Int64;
    max: Int64;
    last_usage_update_time: TimePoint;
    current_used: Int64;
}
declare class AccountTotalResources extends Struct {
    owner: Name;
    net_weight: Asset;
    cpu_weight: Asset;
    ram_bytes: UInt64;
}
declare class AccountSelfDelegatedBandwidth extends Struct {
    from: Name;
    to: Name;
    net_weight: Asset;
    cpu_weight: Asset;
}
declare class AccountRefundRequest extends Struct {
    owner: Name;
    request_time: TimePoint;
    net_amount: Asset;
    cpu_amount: Asset;
}
declare class AccountVoterInfo extends Struct {
    owner: Name;
    proxy: Name;
    producers: Name[];
    staked?: Int64;
    last_vote_weight: Float64;
    proxied_vote_weight: Float64;
    is_proxy: boolean;
    flags1?: UInt32;
    reserved2: UInt32;
    reserved3: string;
}
declare class AccountRexInfoMaturities extends Struct {
    /** Expected results from after EOSIO.Contracts v1.9.0 */
    key?: TimePoint;
    value?: Int64;
    /** Expected results from before EOSIO.Contracts v1.9.0 */
    first?: TimePoint;
    second?: Int64;
}
declare class AccountRexInfo extends Struct {
    version: UInt32;
    owner: Name;
    vote_stake: Asset;
    rex_balance: Asset;
    matured_rex: Int64;
    rex_maturities: AccountRexInfoMaturities[];
}
interface GetAbiResponse {
    account_name: string;
    abi?: ABI.Def;
}
declare class GetRawAbiResponse extends Struct {
    account_name: Name;
    code_hash: Checksum256;
    abi_hash: Checksum256;
    abi: Blob;
}
declare class AccountObject extends Struct {
    /** The account name of the retrieved account */
    account_name: Name;
    /** Highest block number on the chain */
    head_block_num: UInt32;
    /** Highest block unix timestamp. */
    head_block_time: TimePoint;
    /** Indicator of if this is a privileged system account */
    privileged: boolean;
    /** Last update to accounts contract as unix timestamp. */
    last_code_update: TimePoint;
    /** Account created as unix timestamp. */
    created: TimePoint;
    /** Account core token balance */
    core_liquid_balance?: Asset;
    ram_quota: Int64;
    net_weight: Int64;
    cpu_weight: Int64;
    net_limit: AccountResourceLimit;
    cpu_limit: AccountResourceLimit;
    subjective_cpu_bill_limit: AccountResourceLimit;
    ram_usage: UInt64;
    permissions: AccountPermission[];
    total_resources: AccountTotalResources;
    self_delegated_bandwidth?: AccountSelfDelegatedBandwidth;
    refund_request?: AccountRefundRequest;
    voter_info?: AccountVoterInfo;
    rex_info?: AccountRexInfo;
    getPermission(permission: NameType): AccountPermission;
}
declare class AccountByAuthorizersRow extends Struct {
    account_name: Name;
    permission_name: Name;
    authorizing_key: PublicKey;
    authorizing_account: PermissionLevel;
    weight: Weight;
    threshold: UInt32;
}
declare class AccountsByAuthorizers extends Struct {
    accounts: AccountByAuthorizersRow[];
}
declare class NewProducersEntry$1 extends Struct {
    producer_name: Name;
    block_signing_key: PublicKey;
}
declare class NewProducers$1 extends Struct {
    version: UInt32;
    producers: NewProducersEntry$1;
}
declare class BlockExtension$1 extends Struct {
    type: UInt16;
    data: Bytes;
}
declare class HeaderExtension$1 extends Struct {
    type: UInt16;
    data: Bytes;
}
declare class TrxVariant$1 implements ABISerializableObject {
    readonly id: Checksum256;
    readonly extra: Record<string, any>;
    static abiName: string;
    static from(data: any): TrxVariant$1;
    constructor(id: Checksum256, extra: Record<string, any>);
    get transaction(): Transaction | undefined;
    get signatures(): Signature[] | undefined;
    equals(other: any): boolean;
    toJSON(): Checksum256;
}
declare class GetBlockResponseTransactionReceipt extends TransactionReceipt {
    trx: TrxVariant$1;
    get id(): Checksum256;
}
declare class GetBlockResponse extends Struct {
    timestamp: TimePoint;
    producer: Name;
    confirmed: UInt16;
    previous: BlockId;
    transaction_mroot: Checksum256;
    action_mroot: Checksum256;
    schedule_version: UInt32;
    new_producers?: NewProducers$1;
    header_extensions?: HeaderExtension$1[];
    new_protocol_features?: any;
    producer_signature: Signature;
    transactions: GetBlockResponseTransactionReceipt[];
    block_extensions: BlockExtension$1[];
    id: BlockId;
    block_num: UInt32;
    ref_block_prefix: UInt32;
}
declare class GetBlockInfoResponse extends Struct {
    block_num: UInt32;
    ref_block_num: UInt16;
    id: BlockId;
    timestamp: TimePoint;
    producer: Name;
    confirmed: UInt16;
    previous: BlockId;
    transaction_mroot: Checksum256;
    action_mroot: Checksum256;
    schedule_version: UInt32;
    producer_signature: Signature;
    ref_block_prefix: UInt32;
}
declare class ActiveScheduleProducerAuthority extends Struct {
    producer_name: Name;
    authority: any;
}
declare class ActiveScheduleProducer extends Struct {
    producer_name: Name;
    authority: ActiveScheduleProducerAuthority;
}
declare class ActiveSchedule extends Struct {
    version: UInt32;
    producers: ActiveScheduleProducer[];
}
declare class BlockStateHeader extends Struct {
    timestamp: TimePoint;
    producer: Name;
    confirmed: UInt16;
    previous: BlockId;
    transaction_mroot: Checksum256;
    action_mroot: Checksum256;
    schedule_version: UInt32;
    header_extensions?: HeaderExtension$1[];
    producer_signature: Signature;
}
declare class GetBlockHeaderStateResponse extends Struct {
    block_num: UInt32;
    dpos_proposed_irreversible_blocknum: UInt32;
    dpos_irreversible_blocknum: UInt32;
    id: BlockId;
    header: BlockStateHeader;
    /** Unstructured any fields specific to header state calls */
    active_schedule: any;
    blockroot_merkle: any;
    producer_to_last_produced: any;
    producer_to_last_implied_irb: any;
    valid_block_signing_authority: any;
    confirm_count: any;
    pending_schedule: any;
    activated_protocol_features: any;
    additional_signatures: any;
}
declare class GetInfoResponse extends Struct {
    /** Hash representing the last commit in the tagged release. */
    server_version: string;
    /** Hash representing the ID of the chain. */
    chain_id: Checksum256;
    /** Highest block number on the chain */
    head_block_num: UInt32;
    /** Highest block number on the chain that has been irreversibly applied to state. */
    last_irreversible_block_num: UInt32;
    /** Highest block ID on the chain that has been irreversibly applied to state. */
    last_irreversible_block_id: BlockId;
    /** Highest block ID on the chain. */
    head_block_id: BlockId;
    /** Highest block unix timestamp. */
    head_block_time: TimePoint;
    /** Producer that signed the highest block (head block). */
    head_block_producer: Name;
    /** CPU limit calculated after each block is produced, approximately 1000 times `blockCpuLimit`. */
    virtual_block_cpu_limit: UInt64;
    /** NET limit calculated after each block is produced, approximately 1000 times `blockNetLimit`. */
    virtual_block_net_limit: UInt64;
    /** Actual maximum CPU limit. */
    block_cpu_limit: UInt64;
    /** Actual maximum NET limit. */
    block_net_limit: UInt64;
    /** String representation of server version. */
    server_version_string?: string;
    /** Sequential block number representing the best known head in the fork database tree. */
    fork_db_head_block_num?: UInt32;
    /** Hash representing the best known head in the fork database tree. */
    fork_db_head_block_id?: BlockId;
    getTransactionHeader(secondsAhead?: number): TransactionHeader;
}
interface PushTransactionResponse {
    transaction_id: string;
    processed: {
        id: string;
        block_num: number;
        block_time: string;
        receipt: {
            status: string;
            cpu_usage_us: number;
            net_usage_words: number;
        };
        elapsed: number;
        net_usage: number;
        scheduled: boolean;
        action_traces: any[];
        account_ram_delta: any;
    };
}
interface SendTransactionResponseExceptionStack {
    context: {
        level: string;
        file: string;
        line: number;
        method: string;
        hostname: string;
        thread_name: string;
        timestamp: string;
    };
    format: string;
    data: any;
}
interface SendTransactionResponseException {
    code: number;
    name: string;
    message: string;
    stack: SendTransactionResponseExceptionStack[];
}
interface SendTransactionResponse {
    transaction_id: string;
    processed: {
        id: string;
        block_num: number;
        block_time: string;
        receipt: {
            status: string;
            cpu_usage_us: number;
            net_usage_words: number;
        };
        elapsed: number;
        except?: SendTransactionResponseException;
        net_usage: number;
        scheduled: boolean;
        action_traces: any[];
        account_ram_delta: any;
    };
}
interface SendTransaction2Options {
    return_failure_trace?: boolean;
    retry_trx?: boolean;
    retry_trx_num_blocks?: number;
}
interface SendTransaction2Response {
    transaction_id: string;
    processed: {
        id: string;
        block_num: number;
        block_time: string;
        receipt: {
            status: string;
            cpu_usage_us: number;
            net_usage_words: number;
        };
        elapsed: number;
        net_usage: number;
        scheduled: boolean;
        action_traces: any[];
        account_ram_delta: any;
    };
}
interface TableIndexTypes {
    float128: Float128;
    float64: Float64;
    i128: UInt128;
    i64: UInt64;
    name: Name;
    ripemd160: Checksum160;
    sha256: Checksum256;
}
type TableIndexType = Name | UInt64 | UInt128 | Float64 | Checksum256 | Checksum160;
interface GetTableRowsParams<Index = TableIndexType | string> {
    /** The name of the smart contract that controls the provided table. */
    code: NameType;
    /** Name of the table to query. */
    table: NameType;
    /** The account to which this data belongs, if omitted will be set to be same as `code`. */
    scope?: string | TableIndexType;
    /** Lower lookup bound. */
    lower_bound?: Index;
    /** Upper lookup bound. */
    upper_bound?: Index;
    /** How many rows to fetch, defaults to 10 if unset. */
    limit?: UInt32Type;
    /** Whether to iterate records in reverse order. */
    reverse?: boolean;
    /** Position of the index used, defaults to primary. */
    index_position?: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth';
    /**
     * Whether node should try to decode row data using code abi.
     * Determined automatically based the `type` param if omitted.
     */
    json?: boolean;
    /**
     * Set to true to populate the ram_payers array in the response.
     */
    show_payer?: boolean;
}
interface GetTableRowsParamsKeyed<Index = TableIndexType, Key = keyof TableIndexTypes> extends GetTableRowsParams<Index> {
    /** Index key type, determined automatically when passing a typed `upper_bound` or `lower_bound`. */
    key_type: Key;
}
interface GetTableRowsParamsTyped<Index = TableIndexType | string, Row = ABISerializableType> extends GetTableRowsParams<Index> {
    /** Result type for each row. */
    type: Row;
}
interface GetTableRowsResponse<Index = TableIndexType, Row = any> {
    rows: Row[];
    more: boolean;
    ram_payers?: Name[];
    next_key?: Index;
}
interface GetTableByScopeParams {
    code: NameType;
    table?: NameType;
    lower_bound?: string;
    upper_bound?: string;
    limit?: UInt32Type;
    reverse?: boolean;
}
declare class GetTableByScopeResponseRow extends Struct {
    code: Name;
    scope: Name;
    table: Name;
    payer: Name;
    count: UInt32;
}
declare class GetTableByScopeResponse extends Struct {
    rows: GetTableByScopeResponseRow[];
    more: string;
}
declare class OrderedActionsResult extends Struct {
    global_action_seq: UInt64;
    account_action_seq: Int64;
    block_num: UInt32;
    block_time: BlockTimestamp;
    action_trace?: any;
    irrevirsible?: boolean;
}
declare class GetActionsResponse extends Struct {
    actions: OrderedActionsResult[];
    last_irreversible_block: Int32;
    head_block_num: Int32;
    time_limit_exceeded_error?: boolean;
}
declare class TransactionTrace extends Struct {
}
declare class Trx extends Struct {
    actions: AnyAction[];
    context_free_actions: AnyAction[];
    context_free_data: any[];
    delay_sec: number;
    expiration: string;
    max_cpu_usage_ms: number;
    max_net_usage_words: number;
    ref_block_num: number;
    ref_block_prefix: number;
    signatures: string[];
}
declare class TransactionInfo extends Struct {
    receipt: TransactionReceipt;
    trx: Trx;
}
declare class GetTransactionResponse extends Struct {
    id: Checksum256;
    block_num: UInt32;
    block_time: BlockTimestamp;
    last_irreversible_block: UInt32;
    traces?: TransactionTrace[];
    trx: TransactionInfo;
}
declare class GetKeyAccountsResponse extends Struct {
    account_names: Name[];
}
declare class GetCodeResponse extends Struct {
    abi: ABI.Def;
    account_name: Name;
    code_hash: Checksum256;
    wast: string;
    wasm: string;
}
declare class GetControlledAccountsResponse extends Struct {
    controlled_accounts: Name[];
}
interface GetCurrencyStatsResponse {
    [key: string]: GetCurrencyStatsItemResponse;
}
declare class GetCurrencyStatsItemResponse extends Struct {
    supply: Asset;
    max_supply: Asset;
    issuer: Name;
}
declare class GetTransactionStatusResponse extends Struct {
    state: string;
    head_number: UInt32;
    head_id: BlockId;
    head_timestamp: TimePoint;
    irreversible_number: UInt32;
    irreversible_id: BlockId;
    irreversible_timestamp: TimePoint;
    earliest_tracked_block_id: BlockId;
    earliest_tracked_block_number: UInt32;
}
declare class ProducerAuthority extends Struct {
    threshold: UInt32;
    keys: KeyWeight[];
}
type ProducerEntry = [number, ProducerAuthority];
declare class Producer extends Struct {
    producer_name: Name;
    authority: ProducerEntry;
    static from(data: any): Struct;
}
declare class ProducerSchedule extends Struct {
    version: UInt32;
    producers: Producer[];
}
declare class GetProducerScheduleResponse extends Struct {
    active: ProducerSchedule;
    pending: ProducerSchedule;
    proposed: ProducerSchedule;
}
declare class ProtocolFeature extends Struct {
    feature_digest: Checksum256;
    activation_ordinal: UInt32;
    activation_block_num: UInt32;
    description_digest: Checksum256;
    dependencies: string[];
    protocol_feature_type: string;
    specification: any[];
}
declare class GetProtocolFeaturesResponse extends Struct {
    activated_protocol_features: ProtocolFeature[];
    more: UInt32;
}
interface GetProtocolFeaturesParams {
    /** Lower lookup bound. */
    lower_bound?: UInt32 | number;
    /** Upper lookup bound. */
    upper_bound?: UInt32 | number;
    /** How many rows to fetch, defaults to 10 if unset. */
    limit?: UInt32Type;
    /** Flag to indicate it is has to search by block number */
    search_by_block_num?: boolean;
    /** Whether to iterate records in reverse order. */
    reverse?: boolean;
}
interface GetAccountsByAuthorizersParams {
    accounts?: NameType[];
    keys?: PublicKeyType[];
}

type types$2_AccountByAuthorizersRow = AccountByAuthorizersRow;
declare const types$2_AccountByAuthorizersRow: typeof AccountByAuthorizersRow;
type types$2_AccountLinkedAction = AccountLinkedAction;
declare const types$2_AccountLinkedAction: typeof AccountLinkedAction;
type types$2_AccountObject = AccountObject;
declare const types$2_AccountObject: typeof AccountObject;
type types$2_AccountPermission = AccountPermission;
declare const types$2_AccountPermission: typeof AccountPermission;
type types$2_AccountRefundRequest = AccountRefundRequest;
declare const types$2_AccountRefundRequest: typeof AccountRefundRequest;
type types$2_AccountResourceLimit = AccountResourceLimit;
declare const types$2_AccountResourceLimit: typeof AccountResourceLimit;
type types$2_AccountRexInfo = AccountRexInfo;
declare const types$2_AccountRexInfo: typeof AccountRexInfo;
type types$2_AccountRexInfoMaturities = AccountRexInfoMaturities;
declare const types$2_AccountRexInfoMaturities: typeof AccountRexInfoMaturities;
type types$2_AccountSelfDelegatedBandwidth = AccountSelfDelegatedBandwidth;
declare const types$2_AccountSelfDelegatedBandwidth: typeof AccountSelfDelegatedBandwidth;
type types$2_AccountTotalResources = AccountTotalResources;
declare const types$2_AccountTotalResources: typeof AccountTotalResources;
type types$2_AccountVoterInfo = AccountVoterInfo;
declare const types$2_AccountVoterInfo: typeof AccountVoterInfo;
type types$2_AccountsByAuthorizers = AccountsByAuthorizers;
declare const types$2_AccountsByAuthorizers: typeof AccountsByAuthorizers;
type types$2_ActiveSchedule = ActiveSchedule;
declare const types$2_ActiveSchedule: typeof ActiveSchedule;
type types$2_ActiveScheduleProducer = ActiveScheduleProducer;
declare const types$2_ActiveScheduleProducer: typeof ActiveScheduleProducer;
type types$2_ActiveScheduleProducerAuthority = ActiveScheduleProducerAuthority;
declare const types$2_ActiveScheduleProducerAuthority: typeof ActiveScheduleProducerAuthority;
type types$2_BlockStateHeader = BlockStateHeader;
declare const types$2_BlockStateHeader: typeof BlockStateHeader;
type types$2_GetAbiResponse = GetAbiResponse;
type types$2_GetAccountsByAuthorizersParams = GetAccountsByAuthorizersParams;
type types$2_GetActionsResponse = GetActionsResponse;
declare const types$2_GetActionsResponse: typeof GetActionsResponse;
type types$2_GetBlockHeaderStateResponse = GetBlockHeaderStateResponse;
declare const types$2_GetBlockHeaderStateResponse: typeof GetBlockHeaderStateResponse;
type types$2_GetBlockInfoResponse = GetBlockInfoResponse;
declare const types$2_GetBlockInfoResponse: typeof GetBlockInfoResponse;
type types$2_GetBlockResponse = GetBlockResponse;
declare const types$2_GetBlockResponse: typeof GetBlockResponse;
type types$2_GetBlockResponseTransactionReceipt = GetBlockResponseTransactionReceipt;
declare const types$2_GetBlockResponseTransactionReceipt: typeof GetBlockResponseTransactionReceipt;
type types$2_GetCodeResponse = GetCodeResponse;
declare const types$2_GetCodeResponse: typeof GetCodeResponse;
type types$2_GetControlledAccountsResponse = GetControlledAccountsResponse;
declare const types$2_GetControlledAccountsResponse: typeof GetControlledAccountsResponse;
type types$2_GetCurrencyStatsItemResponse = GetCurrencyStatsItemResponse;
declare const types$2_GetCurrencyStatsItemResponse: typeof GetCurrencyStatsItemResponse;
type types$2_GetCurrencyStatsResponse = GetCurrencyStatsResponse;
type types$2_GetInfoResponse = GetInfoResponse;
declare const types$2_GetInfoResponse: typeof GetInfoResponse;
type types$2_GetKeyAccountsResponse = GetKeyAccountsResponse;
declare const types$2_GetKeyAccountsResponse: typeof GetKeyAccountsResponse;
type types$2_GetProducerScheduleResponse = GetProducerScheduleResponse;
declare const types$2_GetProducerScheduleResponse: typeof GetProducerScheduleResponse;
type types$2_GetProtocolFeaturesParams = GetProtocolFeaturesParams;
type types$2_GetProtocolFeaturesResponse = GetProtocolFeaturesResponse;
declare const types$2_GetProtocolFeaturesResponse: typeof GetProtocolFeaturesResponse;
type types$2_GetRawAbiResponse = GetRawAbiResponse;
declare const types$2_GetRawAbiResponse: typeof GetRawAbiResponse;
type types$2_GetTableByScopeParams = GetTableByScopeParams;
type types$2_GetTableByScopeResponse = GetTableByScopeResponse;
declare const types$2_GetTableByScopeResponse: typeof GetTableByScopeResponse;
type types$2_GetTableByScopeResponseRow = GetTableByScopeResponseRow;
declare const types$2_GetTableByScopeResponseRow: typeof GetTableByScopeResponseRow;
type types$2_GetTableRowsParams<Index = TableIndexType | string> = GetTableRowsParams<Index>;
type types$2_GetTableRowsParamsKeyed<Index = TableIndexType, Key = keyof TableIndexTypes> = GetTableRowsParamsKeyed<Index, Key>;
type types$2_GetTableRowsParamsTyped<Index = TableIndexType | string, Row = ABISerializableType> = GetTableRowsParamsTyped<Index, Row>;
type types$2_GetTableRowsResponse<Index = TableIndexType, Row = any> = GetTableRowsResponse<Index, Row>;
type types$2_GetTransactionResponse = GetTransactionResponse;
declare const types$2_GetTransactionResponse: typeof GetTransactionResponse;
type types$2_GetTransactionStatusResponse = GetTransactionStatusResponse;
declare const types$2_GetTransactionStatusResponse: typeof GetTransactionStatusResponse;
type types$2_OrderedActionsResult = OrderedActionsResult;
declare const types$2_OrderedActionsResult: typeof OrderedActionsResult;
type types$2_Producer = Producer;
declare const types$2_Producer: typeof Producer;
type types$2_ProducerAuthority = ProducerAuthority;
declare const types$2_ProducerAuthority: typeof ProducerAuthority;
type types$2_ProducerEntry = ProducerEntry;
type types$2_ProducerSchedule = ProducerSchedule;
declare const types$2_ProducerSchedule: typeof ProducerSchedule;
type types$2_ProtocolFeature = ProtocolFeature;
declare const types$2_ProtocolFeature: typeof ProtocolFeature;
type types$2_PushTransactionResponse = PushTransactionResponse;
type types$2_SendTransaction2Options = SendTransaction2Options;
type types$2_SendTransaction2Response = SendTransaction2Response;
type types$2_SendTransactionResponse = SendTransactionResponse;
type types$2_SendTransactionResponseException = SendTransactionResponseException;
type types$2_SendTransactionResponseExceptionStack = SendTransactionResponseExceptionStack;
type types$2_TableIndexType = TableIndexType;
type types$2_TableIndexTypes = TableIndexTypes;
type types$2_TransactionInfo = TransactionInfo;
declare const types$2_TransactionInfo: typeof TransactionInfo;
type types$2_TransactionTrace = TransactionTrace;
declare const types$2_TransactionTrace: typeof TransactionTrace;
type types$2_Trx = Trx;
declare const types$2_Trx: typeof Trx;
declare namespace types$2 {
  export {
    types$2_AccountByAuthorizersRow as AccountByAuthorizersRow,
    types$2_AccountLinkedAction as AccountLinkedAction,
    types$2_AccountObject as AccountObject,
    types$2_AccountPermission as AccountPermission,
    types$2_AccountRefundRequest as AccountRefundRequest,
    types$2_AccountResourceLimit as AccountResourceLimit,
    types$2_AccountRexInfo as AccountRexInfo,
    types$2_AccountRexInfoMaturities as AccountRexInfoMaturities,
    types$2_AccountSelfDelegatedBandwidth as AccountSelfDelegatedBandwidth,
    types$2_AccountTotalResources as AccountTotalResources,
    types$2_AccountVoterInfo as AccountVoterInfo,
    types$2_AccountsByAuthorizers as AccountsByAuthorizers,
    types$2_ActiveSchedule as ActiveSchedule,
    types$2_ActiveScheduleProducer as ActiveScheduleProducer,
    types$2_ActiveScheduleProducerAuthority as ActiveScheduleProducerAuthority,
    BlockExtension$1 as BlockExtension,
    types$2_BlockStateHeader as BlockStateHeader,
    types$2_GetAbiResponse as GetAbiResponse,
    types$2_GetAccountsByAuthorizersParams as GetAccountsByAuthorizersParams,
    types$2_GetActionsResponse as GetActionsResponse,
    types$2_GetBlockHeaderStateResponse as GetBlockHeaderStateResponse,
    types$2_GetBlockInfoResponse as GetBlockInfoResponse,
    types$2_GetBlockResponse as GetBlockResponse,
    types$2_GetBlockResponseTransactionReceipt as GetBlockResponseTransactionReceipt,
    types$2_GetCodeResponse as GetCodeResponse,
    types$2_GetControlledAccountsResponse as GetControlledAccountsResponse,
    types$2_GetCurrencyStatsItemResponse as GetCurrencyStatsItemResponse,
    types$2_GetCurrencyStatsResponse as GetCurrencyStatsResponse,
    types$2_GetInfoResponse as GetInfoResponse,
    types$2_GetKeyAccountsResponse as GetKeyAccountsResponse,
    types$2_GetProducerScheduleResponse as GetProducerScheduleResponse,
    types$2_GetProtocolFeaturesParams as GetProtocolFeaturesParams,
    types$2_GetProtocolFeaturesResponse as GetProtocolFeaturesResponse,
    types$2_GetRawAbiResponse as GetRawAbiResponse,
    types$2_GetTableByScopeParams as GetTableByScopeParams,
    types$2_GetTableByScopeResponse as GetTableByScopeResponse,
    types$2_GetTableByScopeResponseRow as GetTableByScopeResponseRow,
    types$2_GetTableRowsParams as GetTableRowsParams,
    types$2_GetTableRowsParamsKeyed as GetTableRowsParamsKeyed,
    types$2_GetTableRowsParamsTyped as GetTableRowsParamsTyped,
    types$2_GetTableRowsResponse as GetTableRowsResponse,
    types$2_GetTransactionResponse as GetTransactionResponse,
    types$2_GetTransactionStatusResponse as GetTransactionStatusResponse,
    HeaderExtension$1 as HeaderExtension,
    NewProducers$1 as NewProducers,
    NewProducersEntry$1 as NewProducersEntry,
    types$2_OrderedActionsResult as OrderedActionsResult,
    types$2_Producer as Producer,
    types$2_ProducerAuthority as ProducerAuthority,
    types$2_ProducerEntry as ProducerEntry,
    types$2_ProducerSchedule as ProducerSchedule,
    types$2_ProtocolFeature as ProtocolFeature,
    types$2_PushTransactionResponse as PushTransactionResponse,
    types$2_SendTransaction2Options as SendTransaction2Options,
    types$2_SendTransaction2Response as SendTransaction2Response,
    types$2_SendTransactionResponse as SendTransactionResponse,
    types$2_SendTransactionResponseException as SendTransactionResponseException,
    types$2_SendTransactionResponseExceptionStack as SendTransactionResponseExceptionStack,
    types$2_TableIndexType as TableIndexType,
    types$2_TableIndexTypes as TableIndexTypes,
    types$2_TransactionInfo as TransactionInfo,
    types$2_TransactionTrace as TransactionTrace,
    types$2_Trx as Trx,
    TrxVariant$1 as TrxVariant,
  };
}

declare class ChainAPI {
    private client;
    constructor(client: APIClient);
    get_abi(accountName: NameType): Promise<GetAbiResponse>;
    get_code(accountName: NameType): Promise<GetCodeResponse>;
    get_raw_abi(accountName: NameType): Promise<GetRawAbiResponse>;
    get_account(accountName: NameType, responseType?: typeof AccountObject): Promise<AccountObject>;
    get_accounts_by_authorizers(params: GetAccountsByAuthorizersParams): Promise<AccountsByAuthorizers>;
    get_activated_protocol_features(params?: GetProtocolFeaturesParams): Promise<GetProtocolFeaturesResponse>;
    get_block(block_num_or_id: BlockIdType | UInt32Type): Promise<GetBlockResponse>;
    get_block_header_state(block_num_or_id: BlockIdType | UInt32Type): Promise<GetBlockHeaderStateResponse>;
    get_block_info(block_num: UInt32Type): Promise<GetBlockInfoResponse>;
    get_currency_balance(contract: NameType, accountName: NameType, symbol?: string): Promise<Asset[]>;
    get_currency_stats(contract: NameType, symbol: string): Promise<GetCurrencyStatsResponse>;
    get_info(): Promise<GetInfoResponse>;
    get_producer_schedule(): Promise<GetProducerScheduleResponse>;
    compute_transaction(tx: SignedTransactionType | PackedTransaction): Promise<SendTransactionResponse>;
    send_read_only_transaction(tx: SignedTransactionType | PackedTransaction): Promise<SendTransactionResponse>;
    push_transaction(tx: SignedTransactionType | PackedTransaction): Promise<PushTransactionResponse>;
    send_transaction(tx: SignedTransactionType | PackedTransaction): Promise<SendTransactionResponse>;
    send_transaction2(tx: SignedTransactionType | PackedTransaction, options?: SendTransaction2Options): Promise<SendTransaction2Response>;
    get_table_rows<Index extends TableIndexType = Name>(params: GetTableRowsParams<Index>): Promise<GetTableRowsResponse<Index>>;
    get_table_rows<Key extends keyof TableIndexTypes>(params: GetTableRowsParamsKeyed<TableIndexTypes[Key], Key>): Promise<GetTableRowsResponse<TableIndexTypes[Key]>>;
    get_table_rows<Row extends ABISerializableConstructor, Index extends TableIndexType = Name>(params: GetTableRowsParamsTyped<Index, Row>): Promise<GetTableRowsResponse<Index, InstanceType<Row>>>;
    get_table_rows<Row extends ABISerializableConstructor, Key extends keyof TableIndexTypes>(params: GetTableRowsParamsTyped<TableIndexTypes[Key], Row> & GetTableRowsParamsKeyed<TableIndexTypes[Key], Key>): Promise<GetTableRowsResponse<TableIndexTypes[Key], InstanceType<Row>>>;
    get_table_by_scope(params: GetTableByScopeParams): Promise<GetTableByScopeResponse>;
    get_transaction_status(id: Checksum256Type): Promise<GetTransactionStatusResponse>;
}

declare class HistoryAPI {
    private client;
    constructor(client: APIClient);
    get_actions(accountName: NameType, pos: Int32Type, offset: Int32Type): Promise<GetActionsResponse>;
    get_transaction(id: Checksum256Type, options?: {
        blockNumHint?: UInt32Type;
        excludeTraces?: boolean;
    }): Promise<GetTransactionResponse>;
    get_key_accounts(publicKey: PublicKeyType): Promise<GetKeyAccountsResponse>;
    get_controlled_accounts(controllingAccount: NameType): Promise<GetControlledAccountsResponse>;
}

interface APIClientOptions extends FetchProviderOptions {
    /** URL to the API node to use, only used if the provider option is not set. */
    url?: string;
    /** API provider to use, if omitted and the url option is set the default provider will be used.  */
    provider?: APIProvider;
}
interface APIErrorDetail {
    message: string;
    file: string;
    line_number: number;
    method: string;
}
interface APIErrorData {
    code: number;
    name: string;
    what: string;
    details: APIErrorDetail[];
}
type APIMethods = 'POST' | 'GET';
declare class APIError extends Error {
    static __className: string;
    static formatError(error: APIErrorData): string;
    /** The path to the API that failed, e.g. `/v1/chain/get_info`. */
    readonly path: string;
    /** The full response from the API that failed. */
    readonly response: APIResponse;
    constructor(path: string, response: APIResponse);
    /** The nodeos error object. */
    get error(): APIErrorData | undefined;
    /** The nodeos error name, e.g. `tx_net_usage_exceeded` */
    get name(): string;
    /** The nodeos error code, e.g. `3080002`. */
    get code(): number;
    /** List of exceptions, if any. */
    get details(): APIErrorDetail[];
}
declare class APIClient {
    static __className: string;
    readonly provider: APIProvider;
    constructor(options: APIClientOptions);
    v1: {
        chain: ChainAPI;
        history: HistoryAPI;
    };
    call<T extends ABISerializableConstructor>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
        responseType: T;
    }): Promise<InstanceType<T>>;
    call<T extends keyof BuiltinTypes>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
        responseType: T;
    }): Promise<BuiltinTypes[T]>;
    call<T = unknown>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
    }): Promise<T>;
}

declare namespace types$1 {
  export {
    types$2 as v1,
  };
}

/**
 * @argument encodedMessage a complete message from the lower transport layer
 */
type P2PDataHandler = (encodedMessage: Uint8Array) => void;
type P2PErrorHandler = (error: any) => void;
type P2PHandler = () => void;
type P2PEventMap = {
    data: P2PDataHandler;
    error: P2PErrorHandler;
    close: P2PHandler;
};
/**
 * Provider interface for P2P protocol responsible for re-assembling full message payloads before
 * delivering them upstream via event emission
 */
interface P2PProvider {
    write(encodedMessage: Uint8Array, done?: P2PHandler): void;
    end(cb?: P2PHandler): void;
    destroy(err?: Error): void;
    on<T extends keyof P2PEventMap>(event: T, handler: P2PEventMap[T]): this;
}
declare class SimpleEnvelopeP2PProvider {
    static maxReadLength: number;
    private nextProvider;
    private dataHandlers;
    private errorHandlers;
    private remainingData;
    constructor(nextProvider: P2PProvider);
    write(data: Uint8Array, done?: P2PHandler): void;
    end(cb?: P2PHandler): void;
    destroy(err?: Error): void;
    on<T extends keyof P2PEventMap>(event: T, handler: P2PEventMap[T]): this;
    emitData(messageBuffer: Uint8Array): void;
    emitError(err: any): void;
}

declare class HandshakeMessage extends Struct {
    networkVersion: UInt16;
    chainId: Checksum256;
    nodeId: Checksum256;
    key: PublicKey;
    time: Int64;
    token: Checksum256;
    sig: Signature;
    p2pAddress: string;
    lastIrreversibleBlockNumber: UInt32;
    lastIrreversibleBlockId: BlockId;
    headNum: UInt32;
    headId: BlockId;
    os: string;
    agent: string;
    generation: Int16;
}
declare class ChainSizeMessage extends Struct {
    lastIrreversibleBlockNumber: UInt32;
    lastIrreversibleBlockId: BlockId;
    headNum: UInt32;
    headId: BlockId;
}
declare class GoAwayMessage extends Struct {
    reason: UInt8;
    nodeId: Checksum256;
}
declare class TimeMessage extends Struct {
    org: Int64;
    rec: Int64;
    xmt: Int64;
    dst: Int64;
}
declare class NoticeMessage extends Struct {
    knownTrx: Checksum256[];
    knownBlocks: BlockId[];
}
declare class RequestMessage extends Struct {
    reqTrx: Checksum256[];
    reqBlocks: BlockId[];
}
declare class SyncRequestMessage extends Struct {
    startBlock: UInt32;
    endBlock: UInt32;
}
declare class NewProducersEntry extends Struct {
    producer_name: Name;
    block_signing_key: PublicKey;
}
declare class NewProducers extends Struct {
    version: UInt32;
    producers: NewProducersEntry;
}
declare class BlockExtension extends Struct {
    type: UInt16;
    data: Bytes;
}
declare class HeaderExtension extends Struct {
    type: UInt16;
    data: Bytes;
}
declare class TrxVariant extends Variant {
    value: Checksum256 | PackedTransaction;
}
declare class FullTransactionReceipt extends Struct {
    status: UInt8;
    cpu_usage_us: UInt32;
    net_usage_words: VarUInt;
    trx: TrxVariant;
}
declare class BlockHeader extends Struct {
    timeSlot: UInt32;
    producer: Name;
    confirmed: UInt16;
    previous: BlockId;
    transaction_mroot: BlockId;
    action_mroot: BlockId;
    schedule_version: UInt32;
    new_producers?: NewProducers;
    header_extensions: HeaderExtension[];
    get blockNum(): UInt32;
    get id(): BlockId;
}
declare class SignedBlock extends BlockHeader {
    producer_signature: Signature;
    transactions: FullTransactionReceipt[];
    block_extensions: BlockExtension[];
}
declare class NetMessage extends Variant {
    value: HandshakeMessage | ChainSizeMessage | GoAwayMessage | TimeMessage | NoticeMessage | RequestMessage | SyncRequestMessage | SignedBlock | PackedTransaction;
}

type types_BlockExtension = BlockExtension;
declare const types_BlockExtension: typeof BlockExtension;
type types_BlockHeader = BlockHeader;
declare const types_BlockHeader: typeof BlockHeader;
type types_ChainSizeMessage = ChainSizeMessage;
declare const types_ChainSizeMessage: typeof ChainSizeMessage;
type types_FullTransactionReceipt = FullTransactionReceipt;
declare const types_FullTransactionReceipt: typeof FullTransactionReceipt;
type types_GoAwayMessage = GoAwayMessage;
declare const types_GoAwayMessage: typeof GoAwayMessage;
type types_HandshakeMessage = HandshakeMessage;
declare const types_HandshakeMessage: typeof HandshakeMessage;
type types_HeaderExtension = HeaderExtension;
declare const types_HeaderExtension: typeof HeaderExtension;
type types_NetMessage = NetMessage;
declare const types_NetMessage: typeof NetMessage;
type types_NewProducers = NewProducers;
declare const types_NewProducers: typeof NewProducers;
type types_NewProducersEntry = NewProducersEntry;
declare const types_NewProducersEntry: typeof NewProducersEntry;
type types_NoticeMessage = NoticeMessage;
declare const types_NoticeMessage: typeof NoticeMessage;
type types_RequestMessage = RequestMessage;
declare const types_RequestMessage: typeof RequestMessage;
type types_SignedBlock = SignedBlock;
declare const types_SignedBlock: typeof SignedBlock;
type types_SyncRequestMessage = SyncRequestMessage;
declare const types_SyncRequestMessage: typeof SyncRequestMessage;
type types_TimeMessage = TimeMessage;
declare const types_TimeMessage: typeof TimeMessage;
declare namespace types {
  export {
    types_BlockExtension as BlockExtension,
    types_BlockHeader as BlockHeader,
    types_ChainSizeMessage as ChainSizeMessage,
    types_FullTransactionReceipt as FullTransactionReceipt,
    types_GoAwayMessage as GoAwayMessage,
    types_HandshakeMessage as HandshakeMessage,
    types_HeaderExtension as HeaderExtension,
    types_NetMessage as NetMessage,
    types_NewProducers as NewProducers,
    types_NewProducersEntry as NewProducersEntry,
    types_NoticeMessage as NoticeMessage,
    types_RequestMessage as RequestMessage,
    types_SignedBlock as SignedBlock,
    types_SyncRequestMessage as SyncRequestMessage,
    types_TimeMessage as TimeMessage,
  };
}

type SetTimeout = (handler: any, timeout: number, ...args: any[]) => number;
interface P2PClientOptions {
    /** P2P provider to use  */
    provider: P2PProvider;
    /** heartbeat timout in milliseconds, or undefined if no heartbeat is desired */
    heartbeatTimoutMs?: number;
    /** alternative implementation for setTimeout (mostly for testing) */
    setTimeoutImpl?: SetTimeout;
}
/**
 * @argument message a decoded message from the lower transport layer
 */
type P2PMessageHandler = (message: NetMessage) => void;
type P2PClientEventMap = {
    message: P2PMessageHandler;
    error: P2PErrorHandler;
    close: P2PHandler;
};
declare class P2PClient {
    static __className: string;
    readonly provider: P2PProvider;
    private setTimeoutImpl;
    private heartbeatTimoutMs?;
    private heartbeatTimoutId?;
    private eventListeners;
    constructor(options: P2PClientOptions);
    send(message: NetMessage['value'], done?: P2PHandler): void;
    end(cb?: P2PHandler): void;
    destroy(err?: Error): void;
    private handleData;
    private endHeartbeat;
    private resetHeartbeat;
    private handleHeartbeat;
    on<T extends keyof P2PClientEventMap>(event: T, handler: P2PClientEventMap[T]): this;
    once<T extends keyof P2PClientEventMap>(event: T, handler: P2PClientEventMap[T]): this;
    addListener<T extends keyof P2PClientEventMap>(event: T, handler: P2PClientEventMap[T]): this;
    prependListener<T extends keyof P2PClientEventMap>(event: T, handler: P2PClientEventMap[T]): this;
    removeListener<T extends keyof P2PClientEventMap>(event: T, handler: P2PClientEventMap[T]): this;
    private addListenerInternal;
    private emit;
}

/**
 * Cancelable promises
 *
 * https://stackoverflow.com/questions/46461801/possible-to-add-a-cancel-method-to-promise-in-typescript/46464377#46464377
 */
declare class Canceled extends Error {
    silent: boolean;
    constructor(reason: any, silent?: boolean);
}
interface Cancelable<T> extends Promise<T> {
    cancel(reason?: string, silent?: boolean): Cancelable<T>;
}
declare function cancelable<T>(promise: Promise<T>, onCancel?: (canceled: Canceled) => void): Cancelable<T>;

declare class ExplorerDefinition extends Struct {
    prefix: string;
    suffix: string;
    url(id: string): string;
}

type Fetch = (input: any, init?: any) => Promise<any>;
type LogoType = Logo | {
    dark: string;
    light: string;
} | string;
type ExplorerDefinitionType = ExplorerDefinition | {
    prefix: string;
    suffix: string;
    url?: (id: string) => string;
};
type ChainDefinitionType = ChainDefinition | {
    id: Checksum256Type;
    url: string;
    explorer?: ExplorerDefinitionType;
    logo?: LogoType;
};
type LocaleDefinitions = Record<string, any>;

declare class Logo extends Struct {
    dark: string;
    light: string;
    static from(data: LogoType): Logo;
    getVariant(variant: 'dark' | 'light'): string | undefined;
    toString(): string;
}

interface ChainDefinitionArgs {
    id: Checksum256Type;
    url: string;
    logo?: LogoType;
    explorer?: ExplorerDefinitionType;
    accountDataType?: typeof AccountObject;
}
/**
 * The information required to interact with a given chain.
 */
declare class ChainDefinition<AccountDataType extends AccountObject = AccountObject> {
    /**
     * The chain ID.
     */
    id: Checksum256;
    /**
     * The base URL of the chain's API endpoint (e.g. https://jungle4.greymass.com).
     */
    url: string;
    /**
     * The absolute URL(s) to the chain's logo.
     */
    logo?: LogoType;
    /**
     * The explorer definition for the chain.
     */
    explorer?: ExplorerDefinitionType;
    /**
     * The account data type for the chain.
     */
    accountDataType?: typeof AccountObject;
    constructor(data: ChainDefinitionArgs);
    static from<AccountDataType extends AccountObject = AccountObject>(data: ChainDefinitionArgs): ChainDefinition<AccountDataType>;
    get name(): string;
    getLogo(): Logo | undefined;
    equals(def: ChainDefinitionType): boolean;
}
/**
 * A list of string-based chain names to assist autocompletion
 */
type ChainIndices = 'EOS' | 'FIO' | 'FIOTestnet' | 'Jungle4' | 'KylinTestnet' | 'Libre' | 'LibreTestnet' | 'Proton' | 'ProtonTestnet' | 'Telos' | 'TelosTestnet' | 'WAX' | 'WAXTestnet' | 'UX';
/**
 * List of human readable chain names based on the ChainIndices type.
 */
declare const ChainNames: Record<ChainIndices, string>;
declare class TelosAccountVoterInfo extends AccountVoterInfo {
    last_stake: Int64;
}
declare class TelosAccountObject extends AccountObject {
    voter_info?: TelosAccountVoterInfo;
}
declare class WAXAccountVoterInfo extends AccountVoterInfo {
    unpaid_voteshare: Float64;
    unpaid_voteshare_last_updated: TimePoint;
    unpaid_voteshare_change_rate: Float64;
    last_claim_time: TimePoint;
}
declare class WAXAccountObject extends AccountObject {
    voter_info?: WAXAccountVoterInfo;
}
/**
 * An exported list of ChainDefinition entries for select chains.
 */
declare namespace Chains {
    const EOS: ChainDefinition<AccountObject>;
    const FIO: ChainDefinition<AccountObject>;
    const FIOTestnet: ChainDefinition<AccountObject>;
    const Jungle4: ChainDefinition<AccountObject>;
    const KylinTestnet: ChainDefinition<AccountObject>;
    const Libre: ChainDefinition<AccountObject>;
    const LibreTestnet: ChainDefinition<AccountObject>;
    const Proton: ChainDefinition<AccountObject>;
    const ProtonTestnet: ChainDefinition<AccountObject>;
    const Telos: ChainDefinition<TelosAccountObject>;
    const TelosTestnet: ChainDefinition<TelosAccountObject>;
    const WAX: ChainDefinition<WAXAccountObject>;
    const WAXTestnet: ChainDefinition<WAXAccountObject>;
    const UX: ChainDefinition<AccountObject>;
}
/**
 * A list of chain IDs and their ChainIndices for reference lookups
 */
declare const chainIdsToIndices: Map<Checksum256Type, ChainIndices>;
/**
 * A list of known chain IDs and their logos.
 */
declare const chainLogos: Map<Checksum256Type, LogoType>;

interface PowerUpStateOptions {
    timestamp?: TimePointType;
    virtual_block_cpu_limit?: UInt64;
    virtual_block_net_limit?: UInt64;
}

declare abstract class PowerUpStateResource extends Struct {
    version: UInt8;
    weight: Int64;
    weight_ratio: Int64;
    assumed_stake_weight: Int64;
    initial_weight_ratio: Int64;
    target_weight_ratio: Int64;
    initial_timestamp: TimePointSec;
    target_timestamp: TimePointSec;
    exponent: Float64;
    decay_secs: UInt32;
    min_price: Asset;
    max_price: Asset;
    utilization: Int64;
    adjusted_utilization: Int64;
    utilization_timestamp: TimePointSec;
    readonly default_block_cpu_limit: UInt64;
    readonly default_block_net_limit: UInt64;
    abstract per_day(options?: PowerUpStateOptions): number;
    get allocated(): number;
    get reserved(): BN;
    get symbol(): Asset.Symbol;
    cast(): {
        adjusted_utilization: number;
        decay_secs: number;
        exponent: number;
        utilization: number;
        utilization_timestamp: number;
        weight: BN;
        weight_ratio: number;
    };
    utilization_increase(sample: UInt128, frac: any): number;
    price_function(utilization: number): number;
    price_integral_delta(start_utilization: number, end_utilization: number): number;
    fee(utilization_increase: any, adjusted_utilization: any): number;
    determine_adjusted_utilization(options?: PowerUpStateOptions): number;
}

declare class PowerUpStateResourceCPU extends PowerUpStateResource {
    per_day: (options?: PowerUpStateOptions) => number;
    ms_per_day(options?: PowerUpStateOptions): number;
    us_per_day(options?: PowerUpStateOptions): number;
    weight_to_us(sample: UInt128, weight: number): number;
    us_to_weight(sample: UInt128, us: number): number;
    frac: (usage: SampleUsage, us: number) => number;
    frac_by_ms: (usage: SampleUsage, ms: number) => number;
    frac_by_us(usage: SampleUsage, us: number): number;
    price_per: (usage: SampleUsage, us?: number, options?: PowerUpStateOptions) => number;
    price_per_ms: (usage: SampleUsage, ms?: number, options?: PowerUpStateOptions) => number;
    price_per_us(usage: SampleUsage, us?: number, options?: PowerUpStateOptions): number;
}

declare class PowerUpStateResourceNET extends PowerUpStateResource {
    per_day: (options?: PowerUpStateOptions) => number;
    kb_per_day(options?: PowerUpStateOptions): number;
    bytes_per_day(options?: PowerUpStateOptions): number;
    weight_to_bytes(sample: UInt128, weight: number): number;
    bytes_to_weight(sample: UInt128, bytes: number): number;
    frac: (usage: SampleUsage, bytes: number) => number;
    frac_by_kb: (usage: SampleUsage, kilobytes: number) => number;
    frac_by_bytes(usage: SampleUsage, bytes: number): number;
    price_per: (usage: SampleUsage, bytes?: number, options?: PowerUpStateOptions) => number;
    price_per_kb: (usage: SampleUsage, kilobytes?: number, options?: PowerUpStateOptions) => number;
    price_per_byte(usage: SampleUsage, bytes?: number, options?: PowerUpStateOptions): number;
}

declare class PowerUpState extends Struct {
    version: UInt8;
    net: PowerUpStateResourceNET;
    cpu: PowerUpStateResourceCPU;
    powerup_days: UInt32;
    min_powerup_fee: Asset;
}
declare class PowerUpAPI {
    private parent;
    constructor(parent: Resources);
    get_state(): Promise<PowerUpState>;
}

declare class Connector extends Struct {
    balance: Asset;
    weight: Float64;
}
declare class ExchangeState extends Struct {
    supply: Asset;
    base: Connector;
    quote: Connector;
}
declare class RAMState extends ExchangeState {
    price_per(bytes: number): Asset;
    price_per_kb(kilobytes: number): Asset;
    get_input(base: Int64, quote: Int64, value: Int64): Int64;
}
declare class RAMAPI {
    private parent;
    constructor(parent: Resources);
    get_state(): Promise<RAMState>;
}

declare class REXState extends Struct {
    version: UInt8;
    total_lent: Asset;
    total_unlent: Asset;
    total_rent: Asset;
    total_lendable: Asset;
    total_rex: Asset;
    namebid_proceeds: Asset;
    loan_num: UInt64;
    get reserved(): number;
    get symbol(): Asset.Symbol;
    get precision(): number;
    get value(): number;
    exchange(amount: Asset): Asset;
    price_per(sample: SampleUsage, unit?: number): number;
}
declare class REXAPI {
    private parent;
    constructor(parent: Resources);
    get_state(): Promise<REXState>;
}

interface ResourcesOptions extends APIClientOptions {
    api?: APIClient;
    sampleAccount?: string;
    symbol?: string;
    url?: string;
}
interface SampleUsage {
    account: AccountObject;
    cpu: UInt128;
    net: UInt128;
}
declare const BNPrecision: BN;
declare class Resources {
    static __className: string;
    readonly api: APIClient;
    sampleAccount: string;
    symbol: string;
    constructor(options: ResourcesOptions);
    v1: {
        powerup: PowerUpAPI;
        ram: RAMAPI;
        rex: REXAPI;
    };
    getSampledUsage(): Promise<SampleUsage>;
}

export { ABI, ABIDecoder, ABIDef, ABIEncoder, ABISerializable, ABISerializableConstructor, ABISerializableObject, ABISerializableType, types$1 as API, APIClient, APIClientOptions, APIError, APIErrorData, APIErrorDetail, APIMethods, APIProvider, APIResponse, Action, ActionFields, ActionType, AnyAction, AnyInt, AnyTransaction, AnyVariant, Asset, AssetType, Authority, AuthorityType, BNPrecision, Base58, Blob, BlobType, BlockId, BlockIdType, BlockTimestamp, Bytes, BytesEncoding, BytesType, Cancelable, Canceled, ChainAPI, ChainDefinition, ChainDefinitionArgs, ChainDefinitionType, ChainIndices, ChainNames, Chains, Checksum160, Checksum160Type, Checksum256, Checksum256Type, Checksum512, Checksum512Type, CompressionType, Connector, DivisionBehavior, ExchangeState, ExplorerDefinition, ExplorerDefinitionType, ExtendedAsset, ExtendedAssetType, ExtendedSymbol, ExtendedSymbolType, Fetch, FetchProvider, FetchProviderOptions, Float128, Float128Type, Float32, Float32Type, Float64, Float64Type, HistoryAPI, Int, Int128, Int128Type, Int16, Int16Type, Int32, Int32Type, Int64, Int64Type, Int8, Int8Type, KeyType, KeyWeight, LocaleDefinitions, Logo, LogoType, Name, NameType, OverflowBehavior, types as P2P, P2PClient, P2PClientOptions, P2PDataHandler, P2PErrorHandler, P2PEventMap, P2PHandler, P2PMessageHandler, P2PProvider, PackedTransaction, PackedTransactionType, PermissionLevel, PermissionLevelType, PermissionLevelWeight, PowerUpAPI, PowerUpState, PrivateKey, PrivateKeyType, PublicKey, PublicKeyType, RAMAPI, RAMState, REXAPI, REXState, Resources, SampleUsage, Serializer, Signature, SignatureType, SignedTransaction, SignedTransactionFields, SignedTransactionType, SimpleEnvelopeP2PProvider, Struct, StructConstructor, TelosAccountObject, TelosAccountVoterInfo, TimePoint, TimePointSec, TimePointType, Transaction, TransactionExtension, TransactionFields, TransactionHeader, TransactionHeaderFields, TransactionHeaderType, TransactionReceipt, TransactionType, TypeAlias, UInt128, UInt128Type, UInt16, UInt16Type, UInt32, UInt32Type, UInt64, UInt64Type, UInt8, UInt8Type, VarInt, VarIntType, VarUInt, VarUIntType, Variant, VariantConstructor, WAXAccountObject, WAXAccountVoterInfo, WaitWeight, Weight, addressToWireName, arrayEquals, arrayEquatableEquals, arrayToHex, cancelable, chainIdsToIndices, chainLogos, hexToArray, isInstanceOf, secureRandom };
