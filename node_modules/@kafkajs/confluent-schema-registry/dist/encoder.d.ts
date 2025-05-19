/// <reference types="node" />
import { Schema } from './@types';
export declare const MAGIC_BYTE: Buffer;
export declare const encode: (schema: Schema, registryId: number, jsonPayload: any) => Buffer;
