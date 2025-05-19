"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsS3 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const AwsS3V1_node_1 = require("./V1/AwsS3V1.node");
const AwsS3V2_node_1 = require("./V2/AwsS3V2.node");
class AwsS3 extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'AwsS3',
            name: 'awsS3',
            icon: 'file:s3.svg',
            group: ['output'],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Sends data to AWS S3',
            defaultVersion: 2,
        };
        const nodeVersions = {
            1: new AwsS3V1_node_1.AwsS3V1(baseDescription),
            2: new AwsS3V2_node_1.AwsS3V2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.AwsS3 = AwsS3;
//# sourceMappingURL=AwsS3.node.js.map