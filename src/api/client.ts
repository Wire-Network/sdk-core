import { APIProvider, APIResponse, FetchProvider, FetchProviderOptions } from './provider';
import { ABISerializableConstructor, ABISerializableType } from '../serializer/serializable';
import { abiDecode } from '../serializer/decoder';
import { ChainAPI } from './v1/chain';
import { HistoryAPI } from './v1/history';
import { BuiltinTypes } from '../serializer/builtins';
import { HistoryAPIv2 } from './v2/history';
import { StateAPIv2 } from './v2/state';
import { StatsAPIv2 } from './v2/stats';
import { GetRowsOptions, TransactionExtraOptions } from './types';
export { ChainAPI, HistoryAPI };
import * as v1 from './v1/types';
import * as v2 from './v2/types';
import { ABI, Action, AnyAction, CompressionType, KeyType, NameType, PackedTransaction, Signature, SignedTransaction, Transaction, UInt32Type } from '../chain';
import { ethers } from 'ethers';
import { evmSigToWire } from '../utils';

export interface APIClientOptions extends FetchProviderOptions {
    /** URL to the API node to use, only used if the provider option is not set. */
    url?: string;
    /** API provider to use, if omitted and the url option is set the default provider will be used.  */
    provider?: APIProvider;
    /** URL specifically for Hyperion API, if available */
    hyperionUrl?: string;
    /** Optional signer function that receives a message digest (Uint8Array) and returns a signed hash bytes (Promise<Uint8Array>). */
    signer?: SignerProvider;
}
export interface SignerProvider {
    readonly keyType: KeyType;

    /**
     * Sign an arbitrary message payload.
     * If you pass a string, it will be UTF-8 → bytes first.
     * Returns raw sig bytes as Uint8Array.
     */
    signMessage(msg: string | Uint8Array): Promise<Uint8Array>;
}

export interface APIErrorDetail {
    message: string;
    file: string;
    line_number: number;
    method: string;
}

export interface APIErrorData {
    code: number;
    name: string;
    what: string;
    details: APIErrorDetail[];
}

export type APIMethods = 'POST' | 'GET';

export class APIError extends Error {
    static __className = 'APIError';

    static formatError(error: APIErrorData) {
        if (
            error.what === 'unspecified' &&
            error.details[0].file &&
            error.details[0].file === 'http_plugin.cpp' &&
            error.details[0].message.slice(0, 11) === 'unknown key'
        ) {
            // fix cryptic error messages from nodeop for missing accounts
            return 'Account not found';
        } else if (error.what === 'unspecified' && error.details && error.details.length > 0) {
            return error.details[0].message;
        } else if (error.what && error.what.length > 0) {
            return error.what;
        } else {
            return 'Unknown API error';
        }
    }

    /** The path to the API that failed, e.g. `/v1/chain/get_info`. */
    readonly path: string;

    /** The full response from the API that failed. */
    readonly response: APIResponse;

    constructor(path: string, response: APIResponse) {
        let message: string;

        if (response.json && response.json.error) {
            message = `${APIError.formatError(response.json.error)} at ${path}`;
        } else {
            message = `HTTP ${response.status} at ${path}`;
        }

        super(message);
        this.path = path;
        this.response = response;
    }

    /** The nodeop error object. */
    get error() {
        const { json } = this.response;
        return (json ? json.error : undefined) as APIErrorData | undefined;
    }

    /** The nodeop error name, e.g. `tx_net_usage_exceeded` */
    get name() {
        const { error } = this;
        return error ? error.name : 'unspecified';
    }

    /** The nodeop error code, e.g. `3080002`. */
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

export class APIClient {
    static __className = 'APIClient';

    readonly v1Provider: APIProvider;
    readonly v2Provider?: APIProvider;

    /** Optional signer function that receives a message digest Uint8Array and returns a signed hash (Promise<Uint8Array>). */
    readonly signer?: SignerProvider

    constructor(options: APIClientOptions) {
        if (options.provider) this.v1Provider = options.provider;
        else if (options.url) this.v1Provider = new FetchProvider(options.url, options);
        else throw new Error('Missing v1 url or provider');

        if (options.hyperionUrl && options.hyperionUrl != '')
            this.v2Provider = new FetchProvider(options.hyperionUrl, options);

        if (options.signer) this.signer = options.signer;
    }

    v1 = {
        chain: new ChainAPI(this),
        history: new HistoryAPI(this),
    };

    v2 = {
        history: new HistoryAPIv2(this),
        state: new StateAPIv2(this),
        stats: new StatsAPIv2(this)
    };

    async call<T extends ABISerializableConstructor>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
        responseType: T;
    }): Promise<InstanceType<T>>;
    async call<T extends keyof BuiltinTypes>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
        responseType: T;
    }): Promise<BuiltinTypes[T]>;
    async call<T = unknown>(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
    }): Promise<T>;

    async call(args: {
        method?: APIMethods;
        path: string;
        params?: unknown;
        headers?: Record<string, string>;
        responseType?: ABISerializableType;
    }) {
        const isV2 = args.path.startsWith('/v2/');
        if (isV2 && !this.v2Provider) throw new Error('HyperionAPI requires a v2 provider');

        const response = isV2 && this.v2Provider
            ? await this.v2Provider.call(args)
            : await this.v1Provider.call(args);

        const { json } = response;

        if (Math.floor(response.status / 100) !== 2 || (json && typeof json.error === 'object'))
            throw new APIError(args.path, response);

        if (args.responseType)
            return abiDecode({ type: args.responseType, object: response.json });

        return response.json || response.text;
    }


    /**
     * Fetches rows based on the provided options.
     * @param options The options for fetching rows.
     * @returns A Promise that resolves to the fetched rows.
     */
    public async getRows<T = any>(options: GetRowsOptions): Promise<v1.GetTableRowsResponse<any, T>> {
        try {
            // Trim string fields
            for (const key in options) {
                if (typeof options[key] === 'string') {
                    options[key] = (options[key] as string).trim();
                }
            }

            if (!options.key_type) options.key_type = 'i64'; // default to int keytype

            const result = await this.v1.chain.get_table_rows({
                json: true,
                code: options.contract,
                scope: options.scope !== undefined ? options.scope : options.contract,
                table: options.table,
                index_position: options.index_position,
                limit: options.limit != null ? options.limit : DEFAULT_LIMIT,
                lower_bound: options.lower_bound as any,
                upper_bound: options.upper_bound as any,
                key_type: options.key_type,
                reverse: options.reverse !== undefined ? options.reverse : true,
            });

            return result as v1.GetTableRowsResponse<any, T>;
        } catch (e) {
            if (e instanceof APIError) {
                const details = e.details || [];
                const msg = details.map((d: any) => d.message.replace(/Error:/g, '').trim()).join(', ');
                throw new Error(msg);
            }
            else throw e;
        }
    }

    async pushTransaction(action: AnyAction | AnyAction[], opts?: TransactionExtraOptions): Promise<v1.PushTransactionResponse> {
        if (!this.signer) throw new Error('Signer is required to push transaction');

        try {
            const signedTrx = await this.buildSignedTransaction(action, opts);
            const packedTrx = PackedTransaction.fromSigned(signedTrx, CompressionType.none);
            const pushTrx = await this.v1.chain.push_transaction(packedTrx)

            if (opts && opts.wait_final) {
                const result = await pushTrx;
                await this.awaitBlock(result.processed.block_num);
            }

            return pushTrx
        } catch (e) {
            if (e instanceof APIError) {
                const details = e.details || [];
                const msg = details.map((d: any) => d.message.replace(/Error:/g, '').replace(/assertion failure with message: /g, '').trim()).join(', ');
                throw new Error(msg)
            }
            else {
                const msg = e.message.replace(/Error:/g, '') || e
                throw new Error(msg)
            }
        }
    }

    async buildSignedTransaction(action: AnyAction | AnyAction[], opts?: TransactionExtraOptions): Promise<SignedTransaction> {
        const actions = await this.anyToAction(action);
        const info = await this.v1.chain.get_info();
        const header = info.getTransactionHeader();
        const transaction = Transaction.from({
            ...header, actions,
            context_free_actions: (opts && opts.context_free_actions) ? opts.context_free_actions : []
        });
        const digest = transaction.signingDigest(info.chain_id);
        const messageBytes = ethers.utils.arrayify('0x' + digest.hexString);

        if (!this.signer) throw new Error('No signer function provided in APIClient options');

        const ethBytes = await this.signer.signMessage(messageBytes).catch(err => { throw new Error(err) });
        const ethHex = ethers.utils.hexlify(ethBytes);
        const signature = Signature.fromHex(ethHex, KeyType.EM);
        return SignedTransaction.from({ ...transaction, signatures: [signature] });
    }

    async anyToAction(action: AnyAction | AnyAction[]): Promise<Action[]> {
        if (!Array.isArray(action)) action = [action];
        const actions: Action[] = [];
        const knownAbis = new Map<NameType, ABI>();

        for (const act of action) {
            if (!knownAbis.has(act.account)) {
                const abi_res = await this.v1.chain.get_abi(act.account);
                knownAbis.set(act.account, ABI.from(abi_res.abi!));
            }

            actions.push(Action.from(act, knownAbis.get(act.account)!));
        }

        return actions;
    }
    /**
     * Waits until the specified block number is irreversible.
     * @param blocknum The block number to wait for.
     * @param onProgress Optional callback to report progress (blocksLeft, secondsLeft).
     * @param timeoutMs Optional timeout in milliseconds (default: 2 minutes).
     * @throws Error if the timeout is reached before the block becomes irreversible.
     */
    async awaitBlock(
        blocknum: UInt32Type,
        onProgress?: (blocksLeft: number, secondsLeft: number) => void,
        timeoutMs = 120_000, // 2 minutes
        pollInterval = 3000 // 3 seconds 6 blocks half of 12 block round
    ): Promise<void> {
        const start = Date.now();
        let waiting = true;

        while (waiting) {
            const info = await this.v1.chain.get_info();
            const libNum = info.last_irreversible_block_num.toNumber();
            const blocksLeft = Math.max(0, +blocknum - libNum);
            const secondsLeft = blocksLeft * 0.5; // assuming 0.5s per block

            if (onProgress) onProgress(blocksLeft, secondsLeft);

            if (libNum >= +blocknum) {
                waiting = false;
                return;
            }

            if (Date.now() - start > timeoutMs) {
                throw new Error(`Timeout waiting for block ${blocknum} to become irreversible`);
            }

            await new Promise(res => setTimeout(res, pollInterval));
        }
    }
}

export const DEFAULT_LIMIT = 50
