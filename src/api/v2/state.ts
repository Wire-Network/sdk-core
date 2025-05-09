import { APIClient } from "../client";
import { GetAccountResponse, GetKeyAccountsResponse } from "./types";

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
        return this.client.call({
            method: 'GET',
            path: '/v2/state/get_account',
            params: { account, limit, skip }
        });
    }

        /**
     * Fetch accounts by public key
     * @param public_key - public key to search accounts
     * @param limit - Optional limit for pagination
     * @param skip - Optional skip for pagination
     * @returns A promise that resolves to a GetAccountResponse object
     */
    async get_key_accounts(public_key: string, limit?: number, skip?: number): Promise<GetKeyAccountsResponse> {
        return this.client.call({
            method: 'GET',
            path: '/v2/state/get_key_accounts',
            params: { public_key, limit, skip }
        });
    }
}