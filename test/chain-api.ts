import {assert} from 'chai';

// Tests for the wire-sysio PR Wire-Network/wire-sysio#290 unified
// get_table_rows response shape. KV-backed tables now return rows as
// `{key, value, payer?}` objects instead of the legacy form (decoded
// struct directly, or `{data, payer}` when show_payer is set). The
// Chain.get_table_rows wrapper detects the new shape and unwraps it
// so downstream callers keep seeing the same row layout they always have.

import {APIClient, APIProvider, APIResponse} from '$lib';

// Minimal in-memory APIProvider for unit tests. Returns the JSON body
// passed via the `responses` map keyed by request path.
class StubProvider implements APIProvider {
    constructor(private responses: Record<string, any>) {}
    async call(args: {path: string}): Promise<APIResponse> {
        const json = this.responses[args.path];
        if (json === undefined) {
            throw new Error(`StubProvider: no response registered for ${args.path}`);
        }
        return {
            status: 200,
            headers: {},
            json,
            text: JSON.stringify(json),
        };
    }
}

function makeClient(responses: Record<string, any>): APIClient {
    return new APIClient({provider: new StubProvider(responses)});
}

suite('ChainAPI.get_table_rows (wire-sysio KV row shape)', function () {
    test('unwraps the new {key, value} shape into plain rows', async function () {
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {
                        key: {scope: 'alice', sym_code: '1397703940'},
                        value: {balance: '100.0000 SYS'},
                    },
                    {
                        key: {scope: 'alice', sym_code: '1145521988'},
                        value: {balance: '200.0000 AAA'},
                    },
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'alice',
            table: 'accounts',
        });

        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows[0], {balance: '100.0000 SYS'});
        assert.deepEqual(result.rows[1], {balance: '200.0000 AAA'});
        assert.equal(result.more, false);
        assert.isUndefined(result.ram_payers);
    });

    test('unwraps the new shape with show_payer and captures payers', async function () {
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {
                        key: {scope: 'alice', sym_code: '1397703940'},
                        value: {balance: '100.0000 SYS'},
                        payer: 'alice',
                    },
                    {
                        key: {scope: 'alice', sym_code: '1145521988'},
                        value: {balance: '200.0000 AAA'},
                        payer: 'sysio',
                    },
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'alice',
            table: 'accounts',
            show_payer: true,
        });

        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows[0], {balance: '100.0000 SYS'});
        assert.deepEqual(result.rows[1], {balance: '200.0000 AAA'});
        assert.isDefined(result.ram_payers);
        assert.equal(result.ram_payers!.length, 2);
        assert.equal(String(result.ram_payers![0]), 'alice');
        assert.equal(String(result.ram_payers![1]), 'sysio');
    });

    test('preserves legacy plain-row shape from EOSIO chains', async function () {
        // EOSIO chains still return rows as the decoded struct directly (no
        // {key, value} wrapper). The wrapper must not touch these.
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {owner: 'alice', balance: '100.0000 SYS'},
                    {owner: 'bob', balance: '200.0000 SYS'},
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'sysio.token',
            table: 'accounts',
        });

        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows[0], {owner: 'alice', balance: '100.0000 SYS'});
        assert.deepEqual(result.rows[1], {owner: 'bob', balance: '200.0000 SYS'});
    });

    test('preserves legacy {data, payer} show_payer shape from EOSIO chains', async function () {
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {data: {owner: 'alice', balance: '100.0000 SYS'}, payer: 'alice'},
                    {data: {owner: 'bob', balance: '200.0000 SYS'}, payer: 'sysio'},
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'sysio.token',
            table: 'accounts',
            show_payer: true,
        });

        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows[0], {owner: 'alice', balance: '100.0000 SYS'});
        assert.deepEqual(result.rows[1], {owner: 'bob', balance: '200.0000 SYS'});
        assert.equal(result.ram_payers!.length, 2);
        assert.equal(String(result.ram_payers![0]), 'alice');
        assert.equal(String(result.ram_payers![1]), 'sysio');
    });

    test('empty rows array works for both shapes', async function () {
        const client = makeClient({
            '/v1/chain/get_table_rows': {rows: [], more: false, next_key: ''},
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'alice',
            table: 'accounts',
        });

        assert.deepEqual(result.rows, []);
        assert.equal(result.more, false);
    });

    test('missing payer in new shape is reported as undefined', async function () {
        // The unified API makes `payer` optional. When show_payer is true
        // but a row was returned without a payer, the wrapper pushes
        // `undefined` so the absent-payer case is explicit to callers rather
        // than silently coerced to an empty Name.
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {
                        key: {scope: 'alice', sym_code: '1397703940'},
                        value: {balance: '100.0000 SYS'},
                        // payer intentionally omitted
                    },
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'sysio.token',
            scope: 'alice',
            table: 'accounts',
            show_payer: true,
        });

        assert.equal(result.rows.length, 1);
        assert.deepEqual(result.rows[0], {balance: '100.0000 SYS'});
        assert.equal(result.ram_payers!.length, 1);
        assert.isUndefined(result.ram_payers![0]);
    });

    test('does not unwrap user table that happens to have scalar key+value fields', async function () {
        // A user-defined table with struct {key: string, value: uint64} would
        // collide with the wire-sysio KV shape on field-name alone. Requiring
        // `key` to be an object (wire KV keys are always composite) avoids
        // misinterpreting these rows.
        const client = makeClient({
            '/v1/chain/get_table_rows': {
                rows: [
                    {key: 'some_setting', value: 42},
                    {key: 'other_setting', value: 7},
                ],
                more: false,
                next_key: '',
            },
        });

        const result = await client.v1.chain.get_table_rows({
            code: 'user.contract',
            scope: 'user.contract',
            table: 'settings',
        });

        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows[0], {key: 'some_setting', value: 42});
        assert.deepEqual(result.rows[1], {key: 'other_setting', value: 7});
    });
});
