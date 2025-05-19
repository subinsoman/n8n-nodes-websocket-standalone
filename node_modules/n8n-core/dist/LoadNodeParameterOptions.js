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
exports.LoadNodeParameterOptions = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const NodeExecuteFunctions = __importStar(require("./NodeExecuteFunctions"));
const LoadNodeDetails_1 = require("./LoadNodeDetails");
class LoadNodeParameterOptions extends LoadNodeDetails_1.LoadNodeDetails {
    async getOptionsViaMethodName(methodName, additionalData) {
        var _a, _b;
        const node = this.getTempNode();
        const nodeType = this.workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        const method = (_b = (_a = nodeType === null || nodeType === void 0 ? void 0 : nodeType.methods) === null || _a === void 0 ? void 0 : _a.loadOptions) === null || _b === void 0 ? void 0 : _b[methodName];
        if (typeof method !== 'function') {
            throw new Error(`The node-type "${node.type}" does not have the method "${methodName}" defined!`);
        }
        const thisArgs = NodeExecuteFunctions.getLoadOptionsFunctions(this.workflow, node, this.path, additionalData);
        return method.call(thisArgs);
    }
    async getOptionsViaRequestProperty(loadOptions, additionalData) {
        var _a, _b;
        const node = this.getTempNode();
        const nodeType = this.workflow.nodeTypes.getByNameAndVersion(node.type, node === null || node === void 0 ? void 0 : node.typeVersion);
        if (!((_b = (_a = nodeType === null || nodeType === void 0 ? void 0 : nodeType.description) === null || _a === void 0 ? void 0 : _a.requestDefaults) === null || _b === void 0 ? void 0 : _b.baseURL)) {
            throw new Error(`The node-type "${node.type}" does not exist or does not have "requestDefaults.baseURL" defined!`);
        }
        const mode = 'internal';
        const runIndex = 0;
        const connectionInputData = [];
        const runExecutionData = { resultData: { runData: {} } };
        const routingNode = new n8n_workflow_1.RoutingNode(this.workflow, node, connectionInputData, runExecutionData !== null && runExecutionData !== void 0 ? runExecutionData : null, additionalData, mode);
        const tempNode = {
            ...nodeType,
            ...{
                description: {
                    ...nodeType.description,
                    properties: [
                        {
                            displayName: '',
                            type: 'string',
                            name: '',
                            default: '',
                            routing: loadOptions.routing,
                        },
                    ],
                },
            },
        };
        const inputData = {
            main: [[{ json: {} }]],
        };
        const optionsData = await routingNode.runNode(inputData, runIndex, tempNode, { node, source: null, data: {} }, NodeExecuteFunctions);
        if ((optionsData === null || optionsData === void 0 ? void 0 : optionsData.length) === 0) {
            return [];
        }
        if (!Array.isArray(optionsData)) {
            throw new Error('The returned data is not an array!');
        }
        return optionsData[0].map((item) => item.json);
    }
}
exports.LoadNodeParameterOptions = LoadNodeParameterOptions;
//# sourceMappingURL=LoadNodeParameterOptions.js.map