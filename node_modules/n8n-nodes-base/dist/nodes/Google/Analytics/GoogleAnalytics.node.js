"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalytics = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GoogleAnalyticsV1_node_1 = require("./v1/GoogleAnalyticsV1.node");
const GoogleAnalyticsV2_node_1 = require("./v2/GoogleAnalyticsV2.node");
class GoogleAnalytics extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Google Analytics',
            name: 'googleAnalytics',
            icon: 'file:analytics.svg',
            group: ['transform'],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Use the Google Analytics API',
            defaultVersion: 2,
        };
        const nodeVersions = {
            1: new GoogleAnalyticsV1_node_1.GoogleAnalyticsV1(baseDescription),
            2: new GoogleAnalyticsV2_node_1.GoogleAnalyticsV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.GoogleAnalytics = GoogleAnalytics;
//# sourceMappingURL=GoogleAnalytics.node.js.map