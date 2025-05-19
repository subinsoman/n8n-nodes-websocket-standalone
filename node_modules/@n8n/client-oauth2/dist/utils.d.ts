import type { ClientOAuth2Options, ClientOAuth2RequestObject } from './ClientOAuth2';
export declare function expects<Keys extends keyof ClientOAuth2Options>(obj: ClientOAuth2Options, ...keys: Keys[]): asserts obj is ClientOAuth2Options & {
    [K in Keys]: NonNullable<ClientOAuth2Options[K]>;
};
export declare class AuthError extends Error {
    readonly body: any;
    readonly code: string;
    constructor(message: string, body: any, code?: string);
}
export declare function getAuthError(body: {
    error: string;
    error_description?: string;
}): Error | undefined;
export declare function auth(username: string, password: string): string;
export declare function getRequestOptions({ url, method, body, query, headers }: ClientOAuth2RequestObject, options: ClientOAuth2Options): ClientOAuth2RequestObject;
