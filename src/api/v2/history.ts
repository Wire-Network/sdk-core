import { APIClient } from "../client";
import { GetActionsParams, GetActionsResponse, GetCreatedAccountsParams, GetCreatedAccountsResponse, GetTransactionResponse } from "./types";

export class HistoryAPIv2 {
    constructor(private client: APIClient) { }

    /**
     * Fetch a transaction by ID
     * @param id - Transaction ID
     * @param block_hint - Optional block hint for performance
     */
    async get_transaction(id: string, block_hint?: number): Promise<GetTransactionResponse> {
        if (!this.client.hyperionProvider) throw new Error('HyperionAPI requires a provider');

        return this.client.call({
            method: 'GET',
            path: '/v2/history/get_transaction',
            params: { id, block_hint },
            responseType: GetTransactionResponse,
        });
    }

    /**
     * Fetch actions based on specified parameters
     * @param params - Query parameters for fetching actions
     * @returns A promise that resolves to a GetActionsResponse object
     */
    async get_actions(params?: GetActionsParams): Promise<GetActionsResponse> {
        if (!this.client.hyperionProvider) throw new Error('HyperionAPI requires a provider');

        return this.client.call({
            method: 'GET',
            path: `/v2/history/get_actions`,
            params: params as any || {},
            responseType: GetActionsResponse,
        });
    }

    /**
     * Fetch all accounts created by a specified account
     * @param params - Query parameters for fetching created accounts
     * @returns A promise that resolves to a GetCreatedAccountsResponse object containing an array of CreatedAccounts
     */
    async get_created_accounts(params: GetCreatedAccountsParams): Promise<GetCreatedAccountsResponse> {
        if (!this.client.hyperionProvider) throw new Error('HyperionAPI requires a provider');

        return this.client.call({
            method: 'GET',
            path: `/v2/history/get_created_accounts`,
            params: params as any || {},
            responseType: GetCreatedAccountsResponse,
        });
    }
}