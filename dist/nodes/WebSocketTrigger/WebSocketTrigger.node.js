"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTrigger = void 0;
const WebSocketRegistry_1 = require("../WebSocketRegistry");
if (!global.websocketExecutionContext) {
    global.websocketExecutionContext = {
        servers: {}
    };
}
class WebSocketTrigger {
    constructor() {
        this.description = {
            displayName: 'WebSocket Trigger',
            name: 'webSocketTrigger',
            icon: 'fa:plug',
            group: ['trigger'],
            version: 1,
            description: 'Starts the workflow when a WebSocket message is received',
            defaults: {
                name: 'WebSocket Trigger',
            },
            inputs: [],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Port',
                    name: 'port',
                    type: 'number',
                    default: 5680,
                    required: true,
                    description: 'The port to listen on',
                },
                {
                    displayName: 'Path',
                    name: 'path',
                    type: 'string',
                    default: '/ws',
                    required: true,
                    description: 'The WebSocket server path',
                },
                {
                    displayName: 'Connection ID',
                    name: 'connectionId',
                    type: 'string',
                    default: '',
                    required: false,
                    description: 'Optional custom connection ID. If not provided, the port will be used',
                },
                {
                    displayName: 'Info',
                    name: 'info',
                    type: 'notice',
                    default: '',
                    displayOptions: {
                        show: {
                            '@version': [1],
                        },
                    },
                    options: [
                        {
                            name: 'info',
                            value: 'The WebSocket server will be available at: ws://localhost:{port}{path}',
                        },
                    ],
                },
            ],
        };
    }
    async trigger() {
        const port = this.getNodeParameter('port');
        const path = this.getNodeParameter('path');
        const customConnectionId = this.getNodeParameter('connectionId', '');
        const executionId = this.getExecutionId();
        const nodeId = this.getNode().id;
        const connectionId = customConnectionId || `${port}`;
        const serverId = `ws-${connectionId}`;
        console.error(`[DEBUG-TRIGGER] Creating WebSocket server with ID: ${serverId}`);
        console.error(`[DEBUG-TRIGGER] Execution ID: ${executionId}, Node ID: ${nodeId}`);
        const context = global.websocketExecutionContext;
        if (!context.servers) {
            context.servers = {};
        }
        const registry = WebSocketRegistry_1.WebSocketRegistry.getInstance();
        console.error(`[DEBUG-TRIGGER] Current WebSocket Servers (Before Creation) ===`);
        registry.listServers();
        try {
            await registry.closeServer(serverId);
            const wss = await registry.getOrCreateServer(serverId, { port, path });
            console.error(`[DEBUG-TRIGGER] WebSocket server created/retrieved successfully`);
            context.servers[serverId] = {
                serverId,
                port,
                path,
                nodeId,
                executionId,
                active: true
            };
            console.error(`[DEBUG-TRIGGER] Server added to execution context: ${JSON.stringify(context.servers[serverId])}`);
            const executeTrigger = async (data) => {
                try {
                    const outputData = {
                        ...data,
                        serverId,
                        path,
                        port,
                        nodeId,
                        executionId,
                        clientId: data.clientId,
                        contextInfo: context.servers[serverId]
                    };
                    console.error(`[DEBUG-TRIGGER] Received message. Server ID: ${serverId}, Client ID: ${data.clientId}`);
                    this.emit([this.helpers.returnJsonArray([outputData])]);
                }
                catch (error) {
                    console.error(`[DEBUG-TRIGGER] Error in trigger execution:`, error);
                }
            };
            wss.on('message', executeTrigger);
            const server = registry.getServer(serverId);
            if (!server) {
                throw new Error(`Failed to verify server ${serverId} is running`);
            }
            const self = this;
            async function closeFunction() {
                console.error(`[DEBUG-TRIGGER] Closing WebSocket server with ID: ${serverId}`);
                if (context.servers && context.servers[serverId]) {
                    context.servers[serverId].active = false;
                }
                const isWorkflowEnd = self.getWorkflow !== undefined;
                console.error(`[DEBUG-TRIGGER] Is workflow end: ${isWorkflowEnd}`);
                if (isWorkflowEnd) {
                    await registry.closeServer(serverId);
                    console.error(`[DEBUG-TRIGGER] Fully closed server due to workflow deactivation/deletion`);
                }
                else {
                    await registry.closeServer(serverId, { keepClientsAlive: true });
                    console.error(`[DEBUG-TRIGGER] Soft-closed server to keep connections open for response nodes`);
                }
            }
            return {
                closeFunction,
            };
        }
        catch (error) {
            console.error(`[DEBUG-TRIGGER] Error in WebSocket trigger:`, error);
            throw error;
        }
    }
}
exports.WebSocketTrigger = WebSocketTrigger;
//# sourceMappingURL=WebSocketTrigger.node.js.map