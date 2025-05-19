"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadNodeListSearch = void 0;
const NodeExecuteFunctions = __importStar(require("./NodeExecuteFunctions"));
const LoadNodeDetails_1 = require("./LoadNodeDetails");
class LoadNodeListSearch extends LoadNodeDetails_1.LoadNodeDetails {
    async getOptionsViaMethodName(methodName, additionalData, filter, paginationToken) {
        var _a, _b;
        const node = this.getTempNode();
        const nodeType = this.workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        const method = (_b = (_a = nodeType === null || nodeType === void 0 ? void 0 : nodeType.methods) === null || _a === void 0 ? void 0 : _a.listSearch) === null || _b === void 0 ? void 0 : _b[methodName];
        if (typeof method !== 'function') {
            throw new Error(`The node-type "${node.type}" does not have the method "${methodName}" defined!`);
        }
        const thisArgs = NodeExecuteFunctions.getLoadOptionsFunctions(this.workflow, node, this.path, additionalData);
        return method.call(thisArgs, filter, paginationToken);
    }
}
exports.LoadNodeListSearch = LoadNodeListSearch;
//# sourceMappingURL=LoadNodeListSearch.js.map