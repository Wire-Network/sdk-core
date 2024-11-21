import { APIClient } from "../client";
import { FetchProvider } from "../provider";
import { GetActionsParams, GetActionsResponse, GetTransactionResponse } from "./types";
   
export class HistoryAPIv2 {
    get provider(): FetchProvider | undefined { return this.api.hyperionProvider }

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
}