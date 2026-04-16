import {isInstanceOf} from '../utils';
import type {ABISerializableObject} from '../serializer/serializable';
import {abiDecode, ABIDecoder} from '../serializer/decoder';
import {abiEncode, ABIEncoder} from '../serializer/encoder';

import {Blob, Name, NameType} from '../';

export type ABIDef = string | Partial<ABI.Def> | ABI | Blob;

export class ABI implements ABISerializableObject {
    static abiName = 'abi';
    static version = 'sysio::abi/1.1';

    version: string;
    /// List of type aliases.
    types: ABI.TypeDef[];
    /// List of variant types.
    variants: ABI.Variant[];
    /// List of struct types.
    structs: ABI.Struct[];
    /// List of contract actions.
    actions: ABI.Action[];
    /// List of contract tables.
    tables: ABI.Table[];
    /// Ricardian contracts.
    ricardian_clauses: ABI.Clause[];
    /// Action Results
    action_results: ABI.ActionResult[];

    constructor(args: Partial<ABI.Def>) {
        this.version = args.version || ABI.version;
        this.types = args.types || [];
        this.variants = args.variants || [];
        this.structs = args.structs || [];
        this.actions = args.actions || [];
        this.tables = args.tables || [];
        this.ricardian_clauses = args.ricardian_clauses || [];
        this.action_results = args.action_results || [];
    }

    static from(value: ABIDef) {
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

    static fromABI(decoder: ABIDecoder) {
        const version = decoder.readString();
        const types: ABI.TypeDef[] = [];
        const numTypes = decoder.readVaruint32();

        for (let i = 0; i < numTypes; i++) {
            types.push({
                new_type_name: decoder.readString(),
                type: decoder.readString(),
            });
        }

        const structs: ABI.Struct[] = [];
        const numStructs = decoder.readVaruint32();

        for (let i = 0; i < numStructs; i++) {
            const name = decoder.readString();
            const base = decoder.readString();
            const numFields = decoder.readVaruint32();
            const fields: ABI.Field[] = [];

            for (let j = 0; j < numFields; j++) {
                fields.push({name: decoder.readString(), type: decoder.readString()});
            }

            structs.push({base, name, fields});
        }

        const actions: ABI.Action[] = [];
        const numActions = decoder.readVaruint32();

        for (let i = 0; i < numActions; i++) {
            const name = Name.fromABI(decoder);
            const type = decoder.readString();
            const ricardian_contract = decoder.readString();
            actions.push({name, type, ricardian_contract});
        }

        const tables: ABI.Table[] = [];
        const numTables = decoder.readVaruint32();

        for (let i = 0; i < numTables; i++) {
            // name is a length-prefixed string (widened from sysio::name uint64);
            // table_id (uint16) and secondary_indexes (vector<index_def>) follow.
            // Binary order matches sysio::chain::table_def.
            const name = decoder.readString();
            const index_type = decoder.readString();
            const key_names: string[] = [];
            const numKeyNames = decoder.readVaruint32();

            for (let j = 0; j < numKeyNames; j++) {
                key_names.push(decoder.readString());
            }

            const key_types: string[] = [];
            const numKeyTypes = decoder.readVaruint32();

            for (let j = 0; j < numKeyTypes; j++) {
                key_types.push(decoder.readString());
            }

            const type = decoder.readString();
            const tidLo = decoder.readByte();
            const tidHi = decoder.readByte();
            const table_id = tidLo | (tidHi << 8);
            const secondary_indexes: ABI.Index[] = [];
            const numIndexes = decoder.readVaruint32();

            for (let j = 0; j < numIndexes; j++) {
                const idxName = decoder.readString();
                const idxKeyType = decoder.readString();
                const idxLo = decoder.readByte();
                const idxHi = decoder.readByte();
                secondary_indexes.push({
                    name: idxName,
                    key_type: idxKeyType,
                    table_id: idxLo | (idxHi << 8),
                });
            }

            tables.push({
                name,
                index_type,
                key_names,
                key_types,
                type,
                table_id,
                secondary_indexes,
            });
        }

        const ricardian_clauses: ABI.Clause[] = [];
        const numClauses = decoder.readVaruint32();

        for (let i = 0; i < numClauses; i++) {
            const id = decoder.readString();
            const body = decoder.readString();
            ricardian_clauses.push({id, body});
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
        const variants: ABI.Variant[] = [];

        if (decoder.canRead()) {
            const numVariants = decoder.readVaruint32();

            for (let i = 0; i < numVariants; i++) {
                const name = decoder.readString();
                const types: string[] = [];
                const numTypes = decoder.readVaruint32();

                for (let j = 0; j < numTypes; j++) {
                    types.push(decoder.readString());
                }

                variants.push({name, types});
            }
        }

        const action_results: ABI.ActionResult[] = [];

        if (decoder.canRead()) {
            const numActionResults = decoder.readVaruint32();

            for (let i = 0; i < numActionResults; i++) {
                const name = Name.fromABI(decoder);
                const result_type = decoder.readString();
                action_results.push({name, result_type});
            }
        }

        // protobuf_types and any further string-typed trailing extensions:
        // drain them so a later-appended extension doesn't cause a decode
        // error. The SDK does not consume these fields. Non-string extensions
        // added in the future will need explicit handling here.
        while (decoder.canRead()) {
            decoder.readString();
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

    toABI(encoder: ABIEncoder) {
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
            encoder.writeString(table.name);
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
            // table_id is uint16 LE; chain side computes DJB2(name) % 65536.
            // Default to 0 for hand-built tables that omit it.
            const tid = table.table_id ?? 0;
            ABI.assertUint16(tid, `table ${table.name} table_id`);
            encoder.writeByte(tid & 0xff);
            encoder.writeByte((tid >> 8) & 0xff);
            const secIdx = table.secondary_indexes ?? [];
            encoder.writeVaruint32(secIdx.length);

            for (const idx of secIdx) {
                encoder.writeString(idx.name);
                encoder.writeString(idx.key_type);
                const idxTid = idx.table_id ?? 0;
                ABI.assertUint16(idxTid, `index ${idx.name} table_id`);
                encoder.writeByte(idxTid & 0xff);
                encoder.writeByte((idxTid >> 8) & 0xff);
            }
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

        // protobuf_types: forward-compat extension; always written as an empty
        // string for symmetry with the parser.
        encoder.writeString('');
    }

    private static assertUint16(value: number, label: string) {
        if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
            throw new Error(
                `ABI ${label} must be a uint16 in [0, 65535], got ${value}`
            );
        }
    }

    resolveType(name: string): ABI.ResolvedType {
        const types: {[name: string]: ABI.ResolvedType} = {};
        return this.resolve({name, types}, {id: 0});
    }

    resolveAll() {
        const types: {[name: string]: ABI.ResolvedType} = {};
        const ctx: {id: number} = {id: 0};
        return {
            types: this.types.map((t) => this.resolve({name: t.new_type_name, types}, ctx)),
            variants: this.variants.map((t) => this.resolve({name: t.name, types}, ctx)),
            structs: this.structs.map((t) => this.resolve({name: t.name, types}, ctx)),
        };
    }

    private resolve(
        {name, types}: {name: string; types: {[name: string]: ABI.ResolvedType}},
        ctx: {id: number}
    ): ABI.ResolvedType {
        const existing = types[name];

        if (existing) {
            return existing;
        }

        const type = new ABI.ResolvedType(name, ++ctx.id);
        types[type.typeName] = type;
        const alias = this.types.find((typeDef) => typeDef.new_type_name == type.name);

        if (alias) {
            type.ref = this.resolve({name: alias.type, types}, ctx);
            return type;
        }

        const struct = this.getStruct(type.name);

        if (struct) {
            if (struct.base) {
                type.base = this.resolve({name: struct.base, types}, ctx);
            }

            type.fields = struct.fields.map((field) => {
                return {
                    name: field.name,
                    type: this.resolve({name: field.type, types}, ctx),
                };
            });
            return type;
        }

        const variant = this.getVariant(type.name);

        if (variant) {
            type.variant = variant.types.map((name) => this.resolve({name, types}, ctx));
            return type;
        }

        // builtin or unknown type
        return type;
    }

    getStruct(name: string): ABI.Struct | undefined {
        return this.structs.find((struct) => struct.name == name);
    }

    getVariant(name: string): ABI.Variant | undefined {
        return this.variants.find((variant) => variant.name == name);
    }

    /** Return arguments type of an action in this ABI. */
    getActionType(actionName: NameType): string | undefined {
        const name = Name.from(actionName).toString();
        const action = this.actions.find((a) => a.name.toString() === name);

        if (action) {
            return action.type;
        }
    }

    equals(other: ABIDef): boolean {
        const o = ABI.from(other);

        if (
            this.version != o.version ||
            this.types.length != o.types.length ||
            this.structs.length != o.structs.length ||
            this.actions.length != o.actions.length ||
            this.tables.length != o.tables.length ||
            this.ricardian_clauses.length != o.ricardian_clauses.length ||
            this.variants.length != o.variants.length ||
            this.action_results.length != o.action_results.length
        ) {
            return false;
        }

        return abiEncode({object: this}).equals(abiEncode({object: o}));
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

export namespace ABI {
    export interface TypeDef {
        new_type_name: string;
        type: string;
    }
    export interface Field {
        name: string;
        type: string;
    }
    export interface Struct {
        name: string;
        base: string;
        fields: Field[];
    }
    export interface Action {
        name: NameType;
        type: string;
        ricardian_contract: string;
    }
    // Per-secondary-index metadata embedded in Table. Mirrors
    // sysio::chain::index_def. table_id is a uint16 DJB2(name) % 65536.
    export interface Index {
        name: string;
        key_type: string;
        table_id?: number;
    }
    // table_def.name is a free-form string (was sysio::name uint64 pre-wire),
    // so names > 12 chars / containing arbitrary characters are valid.
    // table_id (uint16) = DJB2(name) % 65536 and secondary_indexes provide
    // per-table namespace isolation for KV-backed tables. This SDK only
    // supports the wire-sysio binary format.
    export interface Table {
        name: string;
        index_type: string;
        key_names: string[];
        key_types: string[];
        type: string;
        table_id?: number;
        secondary_indexes?: Index[];
    }
    export interface Clause {
        id: string;
        body: string;
    }
    export interface Variant {
        name: string;
        types: string[];
    }
    export interface Def {
        version: string;
        types: TypeDef[];
        variants: Variant[];
        structs: Struct[];
        actions: Action[];
        tables: Table[];
        ricardian_clauses: Clause[];
        action_results: ActionResult[];
    }
    export interface ActionResult {
        name: NameType;
        result_type: string;
    }
    export class ResolvedType {
        name: string;
        id: number;
        isArray: boolean;
        isOptional: boolean;
        isExtension: boolean;

        base?: ResolvedType;
        fields?: {name: string; type: ResolvedType}[];
        variant?: ResolvedType[];
        ref?: ResolvedType;

        constructor(fullName: string, id = 0) {
            let name = fullName;

            if (name.endsWith('$')) {
                name = name.slice(0, -1);
                this.isExtension = true;
            } else {
                this.isExtension = false;
            }

            if (name.endsWith('?')) {
                name = name.slice(0, -1);
                this.isOptional = true;
            } else {
                this.isOptional = false;
            }

            if (name.endsWith('[]')) {
                name = name.slice(0, -2);
                this.isArray = true;
            } else {
                this.isArray = false;
            }

            this.id = id;
            this.name = name;
        }

        /**
         * Type name including suffixes: [] array, ? optional, $ binary ext
         */
        get typeName(): string {
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
            let current: ResolvedType | undefined = this;
            const rv: {name: string; type: ResolvedType}[] = [];
            const seen = new Set<string>();

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
}
