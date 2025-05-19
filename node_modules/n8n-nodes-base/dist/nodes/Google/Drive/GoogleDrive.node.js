"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDrive = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GoogleDriveV1_node_1 = require("./v1/GoogleDriveV1.node");
const GoogleDriveV2_node_1 = require("./v2/GoogleDriveV2.node");
class GoogleDrive extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Google Drive',
            name: 'googleDrive',
            icon: 'file:googleDrive.svg',
            group: ['input'],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Access data on Google Drive',
            defaultVersion: 3,
        };
        const nodeVersions = {
            1: new GoogleDriveV1_node_1.GoogleDriveV1(baseDescription),
            2: new GoogleDriveV1_node_1.GoogleDriveV1(baseDescription),
            3: new GoogleDriveV2_node_1.GoogleDriveV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.GoogleDrive = GoogleDrive;
//# sourceMappingURL=GoogleDrive.node.js.map