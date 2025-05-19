"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketResponse = void 0;
const WebSocketRegistry_1 = require("../WebSocketRegistry");
const ws_1 = __importDefault(require("ws"));
if (!global.websocketExecutionContext) {
    global.websocketExecutionContext = {
        servers: {}
    };
}
class WebSocketResponse {
    constructor() {
        this.description = {
            displayName: 'WebSocket Response',
            name: 'webSocketResponse',
            icon: 'fa:plug',
            group: ['transform'],
            version: 1,
            description: 'Send response to a WebSocket client',
            defaults: {
                name: 'WebSocket Response',
                color: '#885577',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Server ID',
                    name: 'serverId',
                    type: 'string',
                    default: '',
                    description: 'ID of the WebSocket server to send the response to (format: ws-{port} or custom ID)',
                },
                {
                    displayName: 'Connection ID Method',
                    name: 'connectionMethod',
                    type: 'options',
                    options: [
                        {
                            name: 'Use Server ID from Input',
                            value: 'fromInput',
                        },
                        {
                            name: 'Custom Server ID',
                            value: 'custom',
                        },
                        {
                            name: 'Use Context Server',
                            value: 'fromContext',
                        },
                    ],
                    default: 'fromInput',
                    description: 'Where to get the server ID from',
                },
                {
                    displayName: 'Custom Server ID',
                    name: 'customServerId',
                    type: 'string',
                    displayOptions: {
                        show: {
                            connectionMethod: ['custom'],
                        },
                    },
                    default: '',
                    description: 'Custom WebSocket server ID to use (format: ws-{identifier})',
                },
                {
                    displayName: 'Server ID Property',
                    name: 'serverIdProperty',
                    type: 'string',
                    displayOptions: {
                        show: {
                            connectionMethod: ['fromInput'],
                        },
                    },
                    default: 'serverId',
                    description: 'Property in the input data that contains the server ID',
                },
                {
                    displayName: 'Client ID',
                    name: 'clientId',
                    type: 'string',
                    default: '',
                    description: 'ID of the client to send the response to',
                },
                {
                    displayName: 'Client ID Method',
                    name: 'clientMethod',
                    type: 'options',
                    options: [
                        {
                            name: 'Use Client ID from Input',
                            value: 'fromInput',
                        },
                        {
                            name: 'Custom Client ID',
                            value: 'custom',
                        },
                        {
                            name: 'Broadcast to All Clients',
                            value: 'broadcast',
                        },
                    ],
                    default: 'fromInput',
                    description: 'Where to get the client ID from',
                },
                {
                    displayName: 'Client ID Property',
                    name: 'clientIdProperty',
                    type: 'string',
                    displayOptions: {
                        show: {
                            clientMethod: ['fromInput'],
                        },
                    },
                    default: 'clientId',
                    description: 'Property in the input data that contains the client ID',
                },
                {
                    displayName: 'Custom Client ID',
                    name: 'customClientId',
                    type: 'string',
                    displayOptions: {
                        show: {
                            clientMethod: ['custom'],
                        },
                    },
                    default: '',
                    description: 'Custom client ID to send the response to',
                },
                {
                    displayName: 'JSON Response',
                    name: 'jsonResponse',
                    type: 'boolean',
                    default: true,
                    description: 'Whether the response should be formatted as JSON',
                },
                {
                    displayName: 'Response Data',
                    name: 'responseData',
                    type: 'string',
                    default: '={{ JSON.stringify($json) }}',
                    description: 'Response to send to the WebSocket client. JSON string or plain text.',
                    displayOptions: {
                        show: {
                            jsonResponse: [false],
                        },
                    },
                },
                {
                    displayName: 'Response JSON',
                    name: 'responseJson',
                    type: 'json',
                    default: '={{ $json }}',
                    description: 'JSON data to send to the WebSocket client',
                    displayOptions: {
                        show: {
                            jsonResponse: [true],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const registry = WebSocketRegistry_1.WebSocketRegistry.getInstance();
        const executionContext = global.websocketExecutionContext;
        if (!executionContext.servers) {
            executionContext.servers = {};
        }
        console.error('[DEBUG-RESPONSE] Current WebSocket Servers ===');
        registry.listServers();
        for (let i = 0; i < items.length; i++) {
            try {
                const connectionMethod = this.getNodeParameter('connectionMethod', i);
                let serverId;
                switch (connectionMethod) {
                    case 'custom':
                        serverId = this.getNodeParameter('customServerId', i);
                        break;
                    case 'fromContext':
                        const activeServers = Object.entries(executionContext.servers || {})
                            .filter(([_, info]) => info.active === true);
                        if (activeServers.length === 0) {
                            throw new Error('No active WebSocket servers found in execution context');
                        }
                        serverId = activeServers[0][0];
                        break;
                    case 'fromInput':
                    default:
                        const serverIdProperty = this.getNodeParameter('serverIdProperty', i);
                        serverId = items[i].json[serverIdProperty];
                }
                const wss = registry.getServer(serverId);
                if (!wss) {
                    throw new Error(`WebSocket server with ID ${serverId} not found`);
                }
                const clientMethod = this.getNodeParameter('clientMethod', i);
                let clientId;
                switch (clientMethod) {
                    case 'custom':
                        clientId = this.getNodeParameter('customClientId', i);
                        break;
                    case 'broadcast':
                        clientId = undefined;
                        break;
                    case 'fromInput':
                    default:
                        const clientIdProperty = this.getNodeParameter('clientIdProperty', i);
                        clientId = items[i].json[clientIdProperty];
                }
                const isJsonResponse = this.getNodeParameter('jsonResponse', i);
                let messageData;
                if (isJsonResponse) {
                    const responseJson = this.getNodeParameter('responseJson', i);
                    messageData = JSON.stringify(responseJson);
                }
                else {
                    messageData = this.getNodeParameter('responseData', i);
                }
                if (clientId) {
                    const client = registry.getClient(serverId, clientId);
                    if (!client) {
                        throw new Error(`Client with ID ${clientId} not found on server ${serverId}`);
                    }
                    let success = false;
                    let lastError;
                    const maxRetries = 3;
                    const retryDelay = 500;
                    for (let attempt = 0; attempt < maxRetries; attempt++) {
                        try {
                            if (attempt > 0) {
                                console.error(`[DEBUG-RESPONSE] Retry attempt ${attempt + 1} to send message`);
                                await new Promise(resolve => setTimeout(resolve, retryDelay));
                            }
                            if (client.readyState !== ws_1.default.OPEN) {
                                throw new Error(`WebSocket not open (state: ${client.readyState})`);
                            }
                            await new Promise((resolve, reject) => {
                                client.send(messageData, (error) => {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve();
                                    }
                                });
                            });
                            console.error(`[DEBUG-RESPONSE] Message sent to client ${clientId} on server ${serverId}`);
                            success = true;
                            break;
                        }
                        catch (error) {
                            lastError = error;
                            console.error(`[DEBUG-RESPONSE] Error on attempt ${attempt + 1}:`, error.message);
                        }
                    }
                    if (!success) {
                        throw lastError || new Error('Failed to send message after retries');
                    }
                }
                else {
                    let clientCount = 0;
                    registry.broadcastToServer(serverId, messageData, () => clientCount++);
                    console.error(`[DEBUG-RESPONSE] Message broadcast to ${clientCount} clients on server ${serverId}`);
                }
                const outputItem = { ...items[i].json };
                outputItem.success = true;
                outputItem.serverId = serverId;
                outputItem.clientId = clientId;
                if (executionContext.servers && executionContext.servers[serverId]) {
                    outputItem.serverInfo = executionContext.servers[serverId];
                }
                returnData.push({ json: outputItem });
            }
            catch (error) {
                console.error(`[DEBUG-RESPONSE] Error in WebSocket response:`, error);
                const outputItem = { ...items[i].json };
                outputItem.success = false;
                outputItem.error = error.message || 'Unknown error';
                returnData.push({ json: outputItem });
            }
        }
        return [returnData];
    }
}
exports.WebSocketResponse = WebSocketResponse;
//# sourceMappingURL=WebSocketResponse.node.js.map