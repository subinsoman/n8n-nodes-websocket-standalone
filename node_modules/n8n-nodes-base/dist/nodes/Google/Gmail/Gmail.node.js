"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gmail = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GmailV1_node_1 = require("./v1/GmailV1.node");
const GmailV2_node_1 = require("./v2/GmailV2.node");
class Gmail extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Gmail',
            name: 'gmail',
            icon: 'file:gmail.svg',
            group: ['transform'],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Consume the Gmail API',
            defaultVersion: 2.1,
        };
        const nodeVersions = {
            1: new GmailV1_node_1.GmailV1(baseDescription),
            2: new GmailV2_node_1.GmailV2(baseDescription),
            2.1: new GmailV2_node_1.GmailV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.Gmail = Gmail;
//# sourceMappingURL=Gmail.node.js.map