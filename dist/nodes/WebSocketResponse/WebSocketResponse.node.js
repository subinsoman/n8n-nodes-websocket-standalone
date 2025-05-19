"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketResponse = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const WebSocketRegistry_1 = require("../WebSocketRegistry");
class WebSocketResponse {
    constructor() {
        this.description = {
            displayName: 'WebSocket Response',
            name: 'webSocketResponse',
            icon: 'fa:plug',
            group: ['transform'],
            version: 1,
            description: 'Sends a response to a WebSocket client',
            defaults: {
                name: 'WebSocket Response',
            },
            inputs: [{ type: n8n_workflow_1.NodeConnectionType.Main }],
            outputs: [{ type: n8n_workflow_1.NodeConnectionType.Main }],
            properties: [
                {
                    displayName: 'Response Data',
                    name: 'responseData',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The data to send as a response',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const responseData = this.getNodeParameter('responseData', i);
            const serverId = item.json.serverId;
            const clientId = item.json.clientId;
            console.error(`[DEBUG] Processing WebSocket Response - Input data:`, JSON.stringify(item.json, null, 2));
            if (!serverId || !clientId) {
                console.error(`[DEBUG] Missing serverId or clientId in input data:`, item.json);
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Missing serverId or clientId in the input data');
            }
            console.error(`[DEBUG] Processing WebSocket Response ===`);
            console.error(`[DEBUG] Server ID: ${serverId}`);
            console.error(`[DEBUG] Client ID: ${clientId}`);
            let lastError = null;
            let success = false;
            for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
                try {
                    if (attempt > 0) {
                        console.error(`[DEBUG] Retry attempt ${attempt + 1} for server ${serverId}`);
                        await sleep(RETRY_DELAY);
                    }
                    const registry = WebSocketRegistry_1.WebSocketRegistry.getInstance();
                    console.error(`[DEBUG] Current WebSocket Servers ===`);
                    registry.listServers();
                    const server = registry.getServer(serverId);
                    if (!server) {
                        lastError = new n8n_workflow_1.NodeOperationError(this.getNode(), `WebSocket server ${serverId} not found`);
                        console.error(`[DEBUG] Server not found on attempt ${attempt + 1}`);
                        continue;
                    }
                    const client = server.clients.get(clientId);
                    if (!client) {
                        lastError = new n8n_workflow_1.NodeOperationError(this.getNode(), `WebSocket client ${clientId} not found on server ${serverId}`);
                        console.error(`[DEBUG] Client not found on attempt ${attempt + 1}`);
                        continue;
                    }
                    const response = typeof responseData === 'object' ? JSON.stringify(responseData) : responseData;
                    await new Promise((resolve, reject) => {
                        client.send(response, (error) => {
                            if (error) {
                                console.error(`[DEBUG] Error sending response on attempt ${attempt + 1}:`, error);
                                reject(error);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                    console.error(`[DEBUG] Response sent to client ${clientId} on server ${serverId}`);
                    success = true;
                    returnData.push(item);
                    break;
                }
                catch (error) {
                    console.error(`[DEBUG] Error on attempt ${attempt + 1}:`, error);
                    lastError = error;
                }
            }
            if (!success && lastError) {
                throw lastError;
            }
        }
        return [returnData];
    }
}
exports.WebSocketResponse = WebSocketResponse;
//# sourceMappingURL=WebSocketResponse.node.js.map