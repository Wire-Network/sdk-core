import { APIClient } from "../client";
import { FetchProvider } from "../provider";
import { GetAccountResponse } from "./types";

export class StateAPIv2 {
    get provider(): FetchProvider | undefined { return this.api.hyperionProvider }

    constructor(private api: APIClient) {}
    
    /**
     * Fetch account details by account name
     * @param account - The name of the account to fetch
     * @param limit - Optional limit for pagination
     * @param skip - Optional skip for pagination
     * @returns A promise that resolves to a GetAccountResponse object
     */
    async get_account(account: string, limit?: number, skip?: number): Promise<GetAccountResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');

        const response = await this.provider.call({
            path: '/v2/state/get_account',
            params: { account, limit, skip },
            method: 'GET',
        });

        return response.json as GetAccountResponse;
    }

}