"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTrigger = void 0;
const WebSocketRegistry_1 = require("../WebSocketRegistry");
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
                            value: 'The WebSocket server will be available at:\n- Primary: ws://localhost:5678/workflow/{workflowId}\n- Fallback: ws://localhost:5679/workflow/{workflowId} (if n8n server is not accessible)',
                        },
                    ],
                },
            ],
        };
    }
    async trigger() {
        const workflowId = this.getWorkflow().id;
        const path = `/workflow/${workflowId}`;
        const serverId = `ws-${workflowId}`;
        console.error(`[DEBUG] Creating WebSocket server with ID: ${serverId}`);
        const registry = WebSocketRegistry_1.WebSocketRegistry.getInstance();
        console.error(`[DEBUG] Current WebSocket Servers (Before Creation) ===`);
        registry.listServers();
        try {
            await registry.closeServer(serverId);
            const wss = await registry.getOrCreateServer(serverId, { path });
            console.error(`[DEBUG] WebSocket server created/retrieved successfully`);
            const executeTrigger = async (data) => {
                try {
                    const outputData = {
                        ...data,
                        serverId,
                        path,
                        clientId: data.clientId,
                    };
                    console.error(`[DEBUG] Trigger received message. Server ID: ${serverId}, Client ID: ${data.clientId}`);
                    this.emit([this.helpers.returnJsonArray([outputData])]);
                }
                catch (error) {
                    console.error(`[DEBUG] Error in trigger execution:`, error);
                }
            };
            wss.on('message', executeTrigger);
            const server = registry.getServer(serverId);
            if (!server) {
                throw new Error(`Failed to verify server ${serverId} is running`);
            }
            async function closeFunction() {
                console.error(`[DEBUG] Closing WebSocket server with ID: ${serverId}`);
                await registry.closeServer(serverId);
            }
            return {
                closeFunction,
            };
        }
        catch (error) {
            console.error(`[DEBUG] Error in WebSocket trigger:`, error);
            throw error;
        }
    }
}
exports.WebSocketTrigger = WebSocketTrigger;
//# sourceMappingURL=WebSocketTrigger.node.js.map