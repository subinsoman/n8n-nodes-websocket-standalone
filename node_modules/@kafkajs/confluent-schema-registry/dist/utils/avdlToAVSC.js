"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const avsc_1 = require("avsc");
const errors_1 = require("../errors");
let cache;
const merge = Object.assign;
const isObject = (obj) => obj && typeof obj === 'object';
const isIterable = (obj) => isObject(obj) && typeof obj.map !== 'undefined';
const isFieldArray = (field) => isObject(field) && isObject(field.type) && field.type.type === 'array';
const combine = (rootType, types) => {
    if (!rootType.fields) {
        return rootType;
    }
    const find = (name) => {
        if (typeof name === 'string') {
            name = name.toLowerCase();
        }
        const typeToCombine = types.find((t) => {
            const names = [];
            if (t.namespace) {
                names.push(`${t.namespace}.`);
            }
            names.push(t.name.toLowerCase());
            return names.join('') === name;
        });
        if (!typeToCombine || cache[typeToCombine.name]) {
            return null;
        }
        cache[typeToCombine.name] = 1;
        return combine(typeToCombine, types);
    };
    const combinedFields = rootType.fields.map((field) => {
        if (isFieldArray(field)) {
            const typeToCombine = find(field.type.items);
            return typeToCombine
                ? merge(field, { type: merge(field.type, { items: typeToCombine }) })
                : field;
        }
        else if (isIterable(field.type)) {
            const type = field.type.map((unionType) => {
                if (isObject(unionType)) {
                    const typeToCombine = find(unionType.items);
                    return typeToCombine ? merge(unionType, { items: typeToCombine }) : unionType;
                }
                else {
                    return find(unionType) || unionType;
                }
            });
            return merge(field, { type });
        }
        const typeToCombine = find(field.type);
        return typeToCombine ? merge(field, { type: typeToCombine }) : field;
    });
    return merge(rootType, { fields: combinedFields });
};
function avdlToAVSC(path) {
    cache = {};
    const protocol = avsc_1.readProtocol(fs.readFileSync(path, 'utf8'));
    return merge({ namespace: protocol.namespace }, combine(protocol.types.pop(), protocol.types));
}
exports.avdlToAVSC = avdlToAVSC;
async function avdlToAVSCAsync(path) {
    cache = {};
    const protocol = await new Promise((resolve, reject) => {
        avsc_1.assembleProtocol(path, (err, schema) => {
            if (err) {
                reject(new errors_1.ConfluentSchemaRegistryError(`${err.message}. Caused by: ${err.path}`));
            }
            else {
                resolve(schema);
            }
        });
    });
    return merge({ namespace: protocol.namespace }, combine(protocol.types.pop(), protocol.types));
}
exports.avdlToAVSCAsync = avdlToAVSCAsync;
//# sourceMappingURL=avdlToAVSC.js.map