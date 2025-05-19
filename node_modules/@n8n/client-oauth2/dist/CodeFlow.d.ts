import type { ClientOAuth2, ClientOAuth2Options } from './ClientOAuth2';
import type { ClientOAuth2Token } from './ClientOAuth2Token';
export declare class CodeFlow {
    private client;
    constructor(client: ClientOAuth2);
    getUri(opts?: Partial<ClientOAuth2Options>): string;
    getToken(urlString: string, opts?: Partial<ClientOAuth2Options>): Promise<ClientOAuth2Token>;
}
