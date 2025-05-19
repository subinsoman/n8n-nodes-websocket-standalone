"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mattermost = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const MattermostV1_node_1 = require("./v1/MattermostV1.node");
class Mattermost extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Mattermost',
            name: 'mattermost',
            icon: 'file:mattermost.svg',
            group: ['output'],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Sends data to Mattermost',
            defaultVersion: 1,
        };
        const nodeVersions = {
            1: new MattermostV1_node_1.MattermostV1(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.Mattermost = Mattermost;
//# sourceMappingURL=Mattermost.node.js.map