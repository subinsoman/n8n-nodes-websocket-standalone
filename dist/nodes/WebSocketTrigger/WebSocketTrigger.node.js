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
            outputs: [{ type: "main" /* NodeConnectionType.Main */ }],
            properties: [
                {
                    displayName: 'Path',
                    name: 'path',
                    type: 'string',
                    default: '/ws',
                    required: true,
                    description: 'The WebSocket server path',
                },
                {
                    displayName: 'Port',
                    name: 'port',
                    type: 'number',
                    default: 5680,
                    required: true,
                    description: 'The port to listen on',
                },
            ],
        };
    }
    async trigger() {
        const nodeParameters = this.getNode().parameters;
        const path = nodeParameters.path;
        const port = nodeParameters.port;
        // Generate server ID with the exact format expected by the response node
        const serverId = `ws-${port}`;
        console.error(`[DEBUG] Creating WebSocket server with ID: ${serverId}`);
        const registry = WebSocketRegistry_1.WebSocketRegistry.getInstance();
        console.error(`[DEBUG] Current WebSocket Servers (Before Creation) ===`);
        registry.listServers();
        try {
            // Close any existing server on this port to avoid conflicts
            await registry.closeServer(serverId);
            const wss = await registry.getOrCreateServer(serverId, { port, path });
            console.error(`[DEBUG] WebSocket server created/retrieved successfully`);
            const executeTrigger = async (data) => {
                try {
                    // Include both serverId and clientId in the output
                    const outputData = {
                        ...data,
                        serverId,
                        path,
                        port,
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
            // Verify the server is running
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