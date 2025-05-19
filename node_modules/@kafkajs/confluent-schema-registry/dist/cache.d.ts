import { ForSchemaOptions } from 'avsc';
import { Schema } from './@types';
export default class Cache {
    registryIdBySubject: {
        [key: string]: number;
    };
    schemasByRegistryId: {
        [key: string]: Schema;
    };
    forSchemaOptions?: Partial<ForSchemaOptions>;
    constructor(forSchemaOptions?: Partial<ForSchemaOptions>);
    getLatestRegistryId: (subject: string) => number | undefined;
    setLatestRegistryId: (subject: string, id: number) => number;
    getSchema: (registryId: number) => Schema;
    setSchema: (registryId: number, schema: Schema) => Schema;
    clear: () => void;
}
