/// <reference types="node" />
import { COMPATIBILITY } from './constants';
import { SchemaRegistryAPIClientArgs, SchemaRegistryAPIClientOptions } from './api';
import Cache from './cache';
import { Schema } from './@types';
interface RegisteredSchema {
    id: number;
}
interface Opts {
    compatibility?: COMPATIBILITY;
    separator?: string;
    subject?: string;
}
export default class SchemaRegistry {
    private api;
    private cacheMissRequests;
    cache: Cache;
    constructor({ auth, clientId, host, retry }: SchemaRegistryAPIClientArgs, options?: SchemaRegistryAPIClientOptions);
    register(schema: Schema, userOpts?: Opts): Promise<RegisteredSchema>;
    getSchema(registryId: number): Promise<Schema>;
    encode(registryId: number, jsonPayload: any): Promise<Buffer>;
    decode(buffer: Buffer): Promise<any>;
    getRegistryId(subject: string, version: number | string): Promise<number>;
    getRegistryIdBySchema(subject: string, schema: Schema): Promise<number>;
    getLatestSchemaId(subject: string): Promise<number>;
    private getSchemaOriginRequest;
}
export {};
