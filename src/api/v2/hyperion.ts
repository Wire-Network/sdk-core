import { FetchProvider } from '../provider';
import {
    CheckTransactionResponse,
    GetAbiSnapshotResponse,
    GetAccountResponse,
    GetActionsResponse,
    GetActionUsageResponse,
    GetApiUsageResponse,
    GetCreatedAccountsResponse,
    GetCreatorResponse,
    GetDeltasResponse,
    GetKeyAccountsResponse,
    GetLinksResponse,
    GetMissedBlocksResponse,
    GetProposalsResponse,
    GetResourceUsageResponse,
    GetTokensResponse,
    GetTransactedAccountsResponse,
    GetTransactionResponse,
    GetTransfersResponse,
    GetVotersResponse
} from './types';

export class HyperionAPI {
    private provider: FetchProvider;

    constructor(provider: FetchProvider) {
        if (!provider) throw new Error('HyperionAPI requires a provider');
        this.provider = provider;
    }

    async check_transaction(id: string): Promise<CheckTransactionResponse> {
        const response = await this.provider.call({
            path: '/v2/history/check_transaction',
            params: { id },
            method: 'GET',
        });
        return response.json as CheckTransactionResponse;
    }

    async get_abi_snapshot(params: { contract: string; block?: number; fetch?: boolean }): Promise<GetAbiSnapshotResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_abi_snapshot',
            params,
            method: 'GET',
        });
        return response.json as GetAbiSnapshotResponse;
    }

    async get_actions(params: {
        account?: string;
        filter?: string;
        track?: string;
        skip?: number;
        limit?: number;
        sort?: string;
        block_num?: string;
        global_sequence?: string;
        after?: string;
        before?: string;
        simple?: boolean;
        noBinary?: boolean;
        checkLib?: boolean;
    }): Promise<GetActionsResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_actions',
            params,
            method: 'GET',
        });
        return response.json as GetActionsResponse;
    }

    async get_created_accounts(account: string): Promise<GetCreatedAccountsResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_created_accounts',
            params: { account },
            method: 'GET',
        });
        return response.json as GetCreatedAccountsResponse;
    }

    async get_creator(account: string): Promise<GetCreatorResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_creator',
            params: { account },
            method: 'GET',
        });
        return response.json as GetCreatorResponse;
    }

    async get_deltas(params: {
        code?: string;
        scope?: string;
        table?: string;
        payer?: string;
        after?: string;
        before?: string;
        present?: number;
    }): Promise<GetDeltasResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_deltas',
            params,
            method: 'GET',
        });
        return response.json as GetDeltasResponse;
    }

    async get_transacted_accounts(params: {
        account: string;
        direction: string;
        symbol?: string;
        contract?: string;
        min?: number;
        max?: number;
        limit?: number;
        after?: string;
        before?: string;
    }): Promise<GetTransactedAccountsResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_transacted_accounts',
            params,
            method: 'GET',
        });
        return response.json as GetTransactedAccountsResponse;
    }

    async get_transaction(id: string, block_hint?: number): Promise<GetTransactionResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_transaction',
            params: { id, block_hint },
            method: 'GET',
        });
        return response.json as GetTransactionResponse;
    }

    async get_transfers(params: {
        from?: string;
        to?: string;
        symbol?: string;
        contract?: string;
        skip?: number;
        limit?: number;
        after?: string;
        before?: string;
    }): Promise<GetTransfersResponse> {
        const response = await this.provider.call({
            path: '/v2/history/get_transfers',
            params,
            method: 'GET',
        });
        return response.json as GetTransfersResponse;
    }

    async get_account(account: string): Promise<GetAccountResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_account',
            params: { account },
            method: 'GET',
        });
        return response.json as GetAccountResponse;
    }

    async get_key_accounts(params: { public_key: string; details?: boolean }): Promise<GetKeyAccountsResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_key_accounts',
            params,
            method: 'GET',
        });
        return response.json as GetKeyAccountsResponse;
    }

    async get_links(params: {
        account: string;
        code?: string;
        action?: string;
        permission?: string;
    }): Promise<GetLinksResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_links',
            params,
            method: 'GET',
        });
        return response.json as GetLinksResponse;
    }

    async get_proposals(params: {
        proposer?: string;
        proposal?: string;
        account?: string;
        requested?: string;
        provided?: string;
        executed?: boolean;
        track?: string;
        skip?: number;
        limit?: number;
    }): Promise<GetProposalsResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_proposals',
            params,
            method: 'GET',
        });
        return response.json as GetProposalsResponse;
    }

    async get_tokens(account: string): Promise<GetTokensResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_tokens',
            params: { account },
            method: 'GET',
        });
        return response.json as GetTokensResponse;
    }

    async get_voters(params: {
        producer?: string;
        skip?: number;
        limit?: number;
    }): Promise<GetVotersResponse> {
        const response = await this.provider.call({
            path: '/v2/state/get_voters',
            params,
            method: 'GET',
        });
        return response.json as GetVotersResponse;
    }

    async get_action_usage(params: {
        period: string;
        end_date?: string;
        unique_actors?: boolean;
    }): Promise<GetActionUsageResponse> {
        const response = await this.provider.call({
            path: '/v2/stats/get_action_usage',
            params,
            method: 'GET',
        });
        return response.json as GetActionUsageResponse;
    }

    async get_api_usage(): Promise<GetApiUsageResponse> {
        const response = await this.provider.call({
            path: '/v2/stats/get_api_usage',
            method: 'GET',
        });
        return response.json as GetApiUsageResponse;
    }

    async get_missed_blocks(params: {
        producer?: string;
        after?: string;
        before?: string;
        min_blocks?: number;
    }): Promise<GetMissedBlocksResponse> {
        const response = await this.provider.call({
            path: '/v2/stats/get_missed_blocks',
            params,
            method: 'GET',
        });
        return response.json as GetMissedBlocksResponse;
    }

    async get_resource_usage(params: { code: string; action: string }): Promise<GetResourceUsageResponse> {
        const response = await this.provider.call({
            path: '/v2/stats/get_resource_usage',
            params,
            method: 'GET',
        });
        return response.json as GetResourceUsageResponse;
    }
}