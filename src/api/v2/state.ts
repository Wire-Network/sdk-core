import { APIClient } from "../client";
import { GetAccountResponse } from "./types";

export class StateAPIv2 {
    constructor(private client: APIClient) { }

    /**
     * Fetch account details by account name
     * @param account - The name of the account to fetch
     * @param limit - Optional limit for pagination
     * @param skip - Optional skip for pagination
     * @returns A promise that resolves to a GetAccountResponse object
     */
    async get_account(account: string, limit?: number, skip?: number): Promise<GetAccountResponse> {
        if (!this.client.hyperionProvider) throw new Error('HyperionAPI requires a provider');

        return this.client.call({
            method: 'GET',
            path: '/v2/state/get_account',
            params: { account, limit, skip },
            responseType: GetAccountResponse,
        });
    }
}