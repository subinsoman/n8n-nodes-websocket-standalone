"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrosoftOutlook = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const MicrosoftOutlookV1_node_1 = require("./v1/MicrosoftOutlookV1.node");
const MicrosoftOutlookV2_node_1 = require("./v2/MicrosoftOutlookV2.node");
class MicrosoftOutlook extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Microsoft Outlook',
            name: 'microsoftOutlook',
            group: ['transform'],
            icon: 'file:outlook.svg',
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Consume Microsoft Outlook API',
            defaultVersion: 2,
        };
        const nodeVersions = {
            1: new MicrosoftOutlookV1_node_1.MicrosoftOutlookV1(baseDescription),
            2: new MicrosoftOutlookV2_node_1.MicrosoftOutlookV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.MicrosoftOutlook = MicrosoftOutlook;
//# sourceMappingURL=MicrosoftOutlook.node.js.map