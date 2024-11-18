import {APIMethods} from './client';

type Fetch = (input: any, init?: any) => Promise<any>;

/** Response to an API call.  */
export interface APIResponse {
    json?: any;
    text: string;
    status: number;
    headers: Record<string, string>;
}

export interface APIProvider {
    /**
     * Call an API endpoint and return the response.
     * Provider is responsible for JSON encoding the params and decoding the response.
     * @argument path The endpoint path, e.g. `/v1/chain/get_info`
     * @argument params The request body if any.
     */
    call(args: {path: string; params?: unknown; method?: APIMethods}): Promise<APIResponse>;
}

export interface FetchProviderOptions {
    /**
     * Fetch instance, must be provided in non-browser environments.
     * You can use the node-fetch package in Node.js.
     */
    fetch?: Fetch;
    /**
     * Headers that will be applied to every request
     * */
    headers?: Record<string, string>;
}

/** Default provider that uses the Fetch API to call a single node. */
export class FetchProvider implements APIProvider {
    readonly url: string;
    readonly fetch: Fetch;
    readonly headers: Record<string, string> = {};

    constructor(url: string, options: FetchProviderOptions = {}) {
        url = url.trim();
        if (url.endsWith('/')) url = url.slice(0, -1);
        this.url = url;

        if (options.headers) {
            this.headers = options.headers;
        }

        if (!options.fetch) {
            if (typeof window !== 'undefined' && window.fetch) {
                this.fetch = window.fetch.bind(window);
            } else if (typeof global !== 'undefined' && global.fetch) {
                this.fetch = global.fetch.bind(global);
            } else {
                throw new Error('Missing fetch');
            }
        } else {
            this.fetch = options.fetch;
        }
    }

    async call(args: {
        path: string;
        params?: Record<string, unknown>;
        method?: APIMethods;
        headers?: Record<string, string>;
    }): Promise<APIResponse> {
        const method = args.method || 'POST';
        let url = this.url + args.path;
        const headers = { ...this.headers, ...args.headers };
    
        // Filter out undefined, null, and empty string values
        const params = args.params
            ? Object.entries(args.params)
                  .filter(([_, value]) => value != null && value !== '')
                  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
            : {};
    
        let body: string | undefined;
        
        // If GET method, convert params to query string
        if (method === 'GET' && Object.keys(params).length > 0) {
            url += '?' + new URLSearchParams(params as Record<string, string>).toString();
        } else if (Object.keys(params).length > 0) {
            body = JSON.stringify(params);
        }
    
        const response = await this.fetch(url, {
            method,
            body: method === 'GET' ? undefined : body,
            headers,
        });
    
        const text = await response.text();
        let json: any;
    
        try {
            json = JSON.parse(text);
        } catch {
            // Ignore JSON parse errors
        }
    
        return { headers: Object.fromEntries(response.headers.entries()), status: response.status, json, text };
    }
}
