import { APIClient } from '../client';
import { FetchProvider } from '../provider';
import { GetTransactionResponse } from './types';

export class HyperionAPI {
    get provider() : FetchProvider | undefined{ return this.api.hyperionProvider; }

    constructor(private api: APIClient) {}

    async get_transaction(id: string, block_hint?: number): Promise<GetTransactionResponse> {
        if (!this.provider) throw new Error('HyperionAPI requires a provider');
        const response = await this.provider.call({
            path: '/v2/history/get_transaction',
            params: { id, block_hint },
            method: 'GET',
        });
        return response.json as GetTransactionResponse;
    }
}