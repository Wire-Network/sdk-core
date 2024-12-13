import { APIClient } from '../client';
import { FetchProvider } from '../provider';
import { ApiUsageResponse, GetActionsParams, GetActionsResponse, GetResourceUsageParams, GetResourceUsageResponse, GetTransactionResponse, HealthResponse, MissedBlocksParams, MissedBlocksResponse } from './types';

export class HyperionAPI {
    get provider(): FetchProvider | undefined { 
        return this.api.hyperionProvider; 
    }

    constructor(private api: APIClient) {}

    /**
     * Fetch a transaction by ID
     * @param id - Transaction ID
     * @param block_hint - Optional block hint for performance
     */
    async get_transaction(id: string, block_hint?: number): Promise<GetTransactionResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');
        
        const response = await this.provider.call({
            path: '/v2/history/get_transaction',
            params: { id, block_hint },
            method: 'GET',
        });
        return response.json as GetTransactionResponse;
    }

    /**
     * Fetch actions based on specified parameters
     * @param params - Query parameters for fetching actions
     * @returns A promise that resolves to a GetActionsResponse object
     */
    async get_actions(params?: GetActionsParams): Promise<GetActionsResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: `/v2/history/get_actions`,
            params: params as any || {},
            method: 'GET',
        });

        return response.json as GetActionsResponse;
    }

    async health(): Promise<HealthResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: '/v2/health',
            method: 'GET',
        });

        return response.json as HealthResponse;
    }

    /**
     * Fetch API usage statistics
     * @returns A promise that resolves to an ApiUsageResponse object containing API usage stats
     */
    async get_api_usage(): Promise<ApiUsageResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: '/v2/stats/get_api_usage',
            method: 'GET',
        });

        return response.json as ApiUsageResponse;
    }

    /**
     * Fetch missed blocks statistics
     * @param params - Query parameters to filter the missed blocks data
     */
    async get_missed_blocks(params?: MissedBlocksParams): Promise<MissedBlocksResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: '/v2/stats/get_missed_blocks',
            params: params as any || {},
            method: 'GET',
        });

        return response.json as MissedBlocksResponse;
    }

    /**
     * Fetch resource usage stats for a given contract and action
     * @param params - Query parameters (contract code and action name)
     * @returns A promise that resolves to a GetResourceUsageResponse object
     */
    async get_resource_usage(params: GetResourceUsageParams): Promise<GetResourceUsageResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: '/v2/stats/get_resource_usage',
            params: params as any,
            method: 'GET',
        });

        return response.json as GetResourceUsageResponse;
    }
}