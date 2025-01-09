import { APIClient } from '../client';
import { ApiUsageResponse, GetResourceUsageParams, GetResourceUsageResponse, HealthResponse, MissedBlocksParams, MissedBlocksResponse } from './types';

export class StatsAPIv2 {
    constructor(private client: APIClient) { }

    async health(): Promise<HealthResponse> {
        return this.client.call({
            method: 'GET',
            path: '/v2/health'
        });
    }

    /**
     * Fetch API usage statistics
     * @returns A promise that resolves to an ApiUsageResponse object containing API usage stats
     */
    async get_api_usage(): Promise<ApiUsageResponse> {
        return this.client.call({
            method: 'GET',
            path: '/v2/stats/get_api_usage'
        });
    }

    /**
     * Fetch missed blocks statistics
     * @param params - Query parameters to filter the missed blocks data
     */
    async get_missed_blocks(params?: MissedBlocksParams): Promise<MissedBlocksResponse> {
        return this.client.call({
            method: 'GET',
            path: '/v2/stats/get_missed_blocks',
            params: params || {}
        });
    }

    /**
     * Fetch resource usage stats for a given contract and action
     * @param params - Query parameters (contract code and action name)
     * @returns A promise that resolves to a GetResourceUsageResponse object
     */
    async get_resource_usage(params: GetResourceUsageParams): Promise<GetResourceUsageResponse> {
        return this.client.call({
            method: 'GET',
            path: '/v2/stats/get_resource_usage',
            params
        });
    }
}