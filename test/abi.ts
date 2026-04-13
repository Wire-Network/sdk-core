import {assert} from 'chai';

// Tests for the wire-sysio binary format adopted in PR
// Wire-Network/wire-sysio#288 (table_id namespace isolation). The on-wire
// shape of table_def changed: `name` widened from sysio::name (uint64) to
// a length-prefixed string, and table_id (uint16) + secondary_indexes
// (vector<index_def>) were appended. abi_def also gained a trailing
// protobuf_types extension.

import {ABI, ABIDecoder, ABIEncoder} from '$lib';

function encodeAbi(abi: ABI): Uint8Array {
    const encoder = new ABIEncoder();
    abi.toABI(encoder);
    return encoder.getData();
}

function decodeAbi(bytes: Uint8Array): ABI {
    const decoder = new ABIDecoder(bytes);
    return ABI.fromABI(decoder);
}

suite('abi binary format (wire-sysio table_id namespace isolation)', function () {
    test('round-trips a table with table_id and empty secondary_indexes', function () {
        const original = new ABI({
            version: 'sysio::abi/1.2',
            structs: [
                {
                    name: 'account',
                    base: '',
                    fields: [{name: 'balance', type: 'asset'}],
                },
            ],
            tables: [
                {
                    name: 'accounts',
                    index_type: 'i64',
                    key_names: ['scope', 'primary_key'],
                    key_types: ['name', 'uint64'],
                    type: 'account',
                    table_id: 12345,
                    secondary_indexes: [],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.tables.length, 1);
        const t = decoded.tables[0];
        assert.equal(t.name, 'accounts');
        assert.equal(t.index_type, 'i64');
        assert.deepEqual(t.key_names, ['scope', 'primary_key']);
        assert.deepEqual(t.key_types, ['name', 'uint64']);
        assert.equal(t.type, 'account');
        assert.equal(t.table_id, 12345);
        assert.deepEqual(t.secondary_indexes, []);
    });

    test('round-trips a long table name (>12 chars) - the whole reason name was widened', function () {
        const original = new ABI({
            tables: [
                {
                    name: 'a-very-long-table-name',
                    index_type: 'i64',
                    key_names: ['pk'],
                    key_types: ['uint64'],
                    type: 'row',
                    table_id: 7,
                    secondary_indexes: [],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.tables[0].name, 'a-very-long-table-name');
        assert.equal(decoded.tables[0].table_id, 7);
    });

    test('round-trips secondary_indexes with checksum256 key_type', function () {
        const original = new ABI({
            tables: [
                {
                    name: 'users',
                    index_type: 'i64',
                    key_names: ['scope', 'id'],
                    key_types: ['name', 'uint64'],
                    type: 'user',
                    table_id: 100,
                    secondary_indexes: [
                        {name: 'byowner', key_type: 'name', table_id: 200},
                        {name: 'bybalance', key_type: 'uint64', table_id: 201},
                        {name: 'byhash', key_type: 'checksum256', table_id: 202},
                    ],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        const t = decoded.tables[0];
        assert.equal(t.secondary_indexes!.length, 3);
        assert.deepEqual(t.secondary_indexes![0], {
            name: 'byowner',
            key_type: 'name',
            table_id: 200,
        });
        assert.deepEqual(t.secondary_indexes![1], {
            name: 'bybalance',
            key_type: 'uint64',
            table_id: 201,
        });
        assert.deepEqual(t.secondary_indexes![2], {
            name: 'byhash',
            key_type: 'checksum256',
            table_id: 202,
        });
    });

    test('table_id 0 is preserved (the default for hand-built tables)', function () {
        const original = new ABI({
            tables: [
                {
                    name: 't',
                    index_type: 'i64',
                    key_names: [],
                    key_types: [],
                    type: 'row',
                    table_id: 0,
                    secondary_indexes: [],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.tables[0].table_id, 0);
    });

    test('table_id 65535 (max uint16) round-trips correctly', function () {
        const original = new ABI({
            tables: [
                {
                    name: 't',
                    index_type: 'i64',
                    key_names: [],
                    key_types: [],
                    type: 'row',
                    table_id: 65535,
                    secondary_indexes: [],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.tables[0].table_id, 65535);
    });

    test('missing table_id defaults to 0 on encode', function () {
        // Hand-built ABIs may omit table_id; the encoder defaults to 0 and
        // the decoder reads back 0.
        const original = new ABI({
            tables: [
                {
                    name: 't',
                    index_type: 'i64',
                    key_names: [],
                    key_types: [],
                    type: 'row',
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.tables[0].table_id, 0);
        assert.deepEqual(decoded.tables[0].secondary_indexes, []);
    });

    test('encoder always emits protobuf_types (empty string trailer)', function () {
        // The encoded form should end with the varint-prefixed empty string
        // for protobuf_types: 0x00 (length 0). Verify the last byte is 0x00.
        const abi = new ABI({});
        const bytes = encodeAbi(abi);
        assert.equal(bytes[bytes.length - 1], 0x00);
    });

    test('multi-table ABI with structs, actions, secondary indexes round-trips', function () {
        const original = new ABI({
            version: 'sysio::abi/1.2',
            types: [{new_type_name: 'account_name', type: 'name'}],
            structs: [
                {
                    name: 'transfer',
                    base: '',
                    fields: [
                        {name: 'from', type: 'account_name'},
                        {name: 'to', type: 'account_name'},
                        {name: 'quantity', type: 'asset'},
                        {name: 'memo', type: 'string'},
                    ],
                },
                {
                    name: 'account',
                    base: '',
                    fields: [{name: 'balance', type: 'asset'}],
                },
                {
                    name: 'user',
                    base: '',
                    fields: [
                        {name: 'id', type: 'uint64'},
                        {name: 'owner', type: 'name'},
                    ],
                },
            ],
            actions: [{name: 'transfer', type: 'transfer', ricardian_contract: ''}],
            tables: [
                {
                    name: 'accounts',
                    index_type: 'i64',
                    key_names: ['scope', 'sym_code'],
                    key_types: ['name', 'uint64'],
                    type: 'account',
                    table_id: 1,
                    secondary_indexes: [],
                },
                {
                    name: 'users',
                    index_type: 'i64',
                    key_names: ['scope', 'id'],
                    key_types: ['name', 'uint64'],
                    type: 'user',
                    table_id: 2,
                    secondary_indexes: [{name: 'byowner', key_type: 'name', table_id: 100}],
                },
            ],
        });

        const decoded = decodeAbi(encodeAbi(original));
        assert.equal(decoded.version, 'sysio::abi/1.2');
        assert.equal(decoded.types.length, 1);
        assert.equal(decoded.structs.length, 3);
        assert.equal(decoded.actions.length, 1);
        assert.equal(decoded.tables.length, 2);
        assert.equal(decoded.tables[0].name, 'accounts');
        assert.equal(decoded.tables[0].table_id, 1);
        assert.equal(decoded.tables[1].name, 'users');
        assert.equal(decoded.tables[1].table_id, 2);
        assert.equal(decoded.tables[1].secondary_indexes!.length, 1);
        assert.equal(decoded.tables[1].secondary_indexes![0].name, 'byowner');
    });
});
