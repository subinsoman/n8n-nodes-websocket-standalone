"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadNodeDetails = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const TEMP_NODE_NAME = 'Temp-Node';
const TEMP_WORKFLOW_NAME = 'Temp-Workflow';
class LoadNodeDetails {
    constructor(nodeTypeNameAndVersion, nodeTypes, path, currentNodeParameters, credentials) {
        const nodeType = nodeTypes.getByNameAndVersion(nodeTypeNameAndVersion.name, nodeTypeNameAndVersion.version);
        this.path = path;
        if (nodeType === undefined) {
            throw new Error(`The node-type "${nodeTypeNameAndVersion.name} v${nodeTypeNameAndVersion.version}"  is not known!`);
        }
        const nodeData = {
            parameters: currentNodeParameters,
            id: 'uuid-1234',
            name: TEMP_NODE_NAME,
            type: nodeTypeNameAndVersion.name,
            typeVersion: nodeTypeNameAndVersion.version,
            position: [0, 0],
        };
        if (credentials) {
            nodeData.credentials = credentials;
        }
        const workflowData = {
            nodes: [nodeData],
            connections: {},
        };
        this.workflow = new n8n_workflow_1.Workflow({
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: false,
            nodeTypes,
        });
    }
    getWorkflowData() {
        return {
            name: TEMP_WORKFLOW_NAME,
            active: false,
            connections: {},
            nodes: Object.values(this.workflow.nodes),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    getTempNode() {
        return this.workflow.getNode(TEMP_NODE_NAME);
    }
}
exports.LoadNodeDetails = LoadNodeDetails;
//# sourceMappingURL=LoadNodeDetails.js.map