/// <reference types="node" />
export interface Schema {
    toBuffer: (payload: object) => Buffer;
    fromBuffer: (payload: object) => Buffer;
    isValid: (payload: object, opts: {
        errorHook: (path: any) => void;
    }) => void;
    name: string;
    namespace: string;
}
declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toMatchConfluentAvroEncodedPayload(args: {
                registryId: number;
                payload: Buffer;
            }): R;
        }
    }
}
