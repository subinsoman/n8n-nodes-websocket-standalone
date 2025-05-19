"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSend = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const EmailSendV1_node_1 = require("./v1/EmailSendV1.node");
const EmailSendV2_node_1 = require("./v2/EmailSendV2.node");
class EmailSend extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Send Email',
            name: 'emailSend',
            icon: 'fa:envelope',
            group: ['output'],
            defaultVersion: 2.1,
            description: 'Sends an email using SMTP protocol',
        };
        const nodeVersions = {
            1: new EmailSendV1_node_1.EmailSendV1(baseDescription),
            2: new EmailSendV2_node_1.EmailSendV2(baseDescription),
            2.1: new EmailSendV2_node_1.EmailSendV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.EmailSend = EmailSend;
//# sourceMappingURL=EmailSend.node.js.map