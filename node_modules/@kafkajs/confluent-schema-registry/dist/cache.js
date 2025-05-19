"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const avsc_1 = __importDefault(require("avsc"));
class Cache {
    constructor(forSchemaOptions) {
        this.getLatestRegistryId = (subject) => this.registryIdBySubject[subject];
        this.setLatestRegistryId = (subject, id) => {
            this.registryIdBySubject[subject] = id;
            return this.registryIdBySubject[subject];
        };
        this.getSchema = (registryId) => this.schemasByRegistryId[registryId];
        this.setSchema = (registryId, schema) => {
            // @ts-ignore TODO: Fix typings for Schema...
            this.schemasByRegistryId[registryId] = avsc_1.default.Type.forSchema(schema, this.forSchemaOptions);
            return this.schemasByRegistryId[registryId];
        };
        this.clear = () => {
            this.registryIdBySubject = {};
            this.schemasByRegistryId = {};
        };
        this.registryIdBySubject = {};
        this.schemasByRegistryId = {};
        this.forSchemaOptions = forSchemaOptions;
    }
}
exports.default = Cache;
//# sourceMappingURL=cache.js.map