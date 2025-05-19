"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_OFFSET = 0;
// Based on https://github.com/mtth/avsc/issues/140
const collectInvalidPaths = (schema, jsonPayload) => {
    const paths = [];
    schema.isValid(jsonPayload, {
        errorHook: path => paths.push(path),
    });
    return paths;
};
exports.MAGIC_BYTE = Buffer.alloc(1);
exports.encode = (schema, registryId, jsonPayload) => {
    let avroPayload;
    try {
        avroPayload = schema.toBuffer(jsonPayload);
    }
    catch (error) {
        error.paths = collectInvalidPaths(schema, jsonPayload);
        throw error;
    }
    const registryIdBuffer = Buffer.alloc(4);
    registryIdBuffer.writeInt32BE(registryId, DEFAULT_OFFSET);
    return Buffer.concat([exports.MAGIC_BYTE, registryIdBuffer, avroPayload]);
};
//# sourceMappingURL=encoder.js.map