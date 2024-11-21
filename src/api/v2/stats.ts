import { APIClient } from '../client';
import { FetchProvider } from '../provider';
import { ApiUsageResponse, GetResourceUsageParams, GetResourceUsageResponse, HealthResponse, MissedBlocksParams, MissedBlocksResponse } from './types';

export class StatsAPIv2 {
    get provider(): FetchProvider | undefined { return this.api.hyperionProvider }

    constructor(private api: APIClient) {}

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