"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketRegistry = void 0;
const WebSocket = __importStar(require("ws"));
const http = __importStar(require("http"));
class WebSocketRegistry {
    constructor() {
        this.servers = new Map();
        this.initializationPromise = null;
        // Ensure cleanup on process exit
        process.on('exit', () => {
            this.cleanup();
        });
        process.on('SIGINT', () => {
            this.cleanup();
            process.exit();
        });
    }
    cleanup() {
        console.error('[DEBUG] Cleaning up WebSocket Registry');
        for (const [serverId, instance] of this.servers) {
            try {
                instance.wss.close();
                instance.server.close();
                instance.clients.clear();
                console.error(`[DEBUG] Cleaned up server ${serverId}`);
            }
            catch (error) {
                console.error(`[DEBUG] Error cleaning up server ${serverId}:`, error);
            }
        }
        this.servers.clear();
    }
    static getInstance() {
        if (!WebSocketRegistry.instance) {
            console.error('[DEBUG] Creating new WebSocketRegistry instance');
            WebSocketRegistry.instance = new WebSocketRegistry();
        }
        return WebSocketRegistry.instance;
    }
    async initialize() {
        if (!this.initializationPromise) {
            this.initializationPromise = new Promise((resolve) => {
                console.error('[DEBUG] Initializing WebSocketRegistry');
                // Add any async initialization here if needed
                resolve();
            });
        }
        return this.initializationPromise;
    }
    listServers() {
        console.log('\n=== Available WebSocket Servers ===');
        if (this.servers.size === 0) {
            console.log('No servers currently registered');
        }
        else {
            this.servers.forEach((instance, serverId) => {
                console.log(`\nServer ID: ${serverId}`);
                console.log(`Port: ${instance.config.port}`);
                console.log(`Path: ${instance.config.path}`);
                console.log(`Active Clients: ${instance.clients.size}`);
                instance.clients.forEach((client, clientId) => {
                    console.log(`  - Client ID: ${clientId}`);
                });
            });
        }
        console.log('================================\n');
    }
    async getOrCreateServer(serverId, config) {
        await this.initialize();
        console.error(`[DEBUG] Attempting to get or create server with ID: ${serverId}`);
        this.listServers();
        if (this.servers.has(serverId)) {
            const existingServer = this.servers.get(serverId);
            console.error(`[DEBUG] Found existing server with ID: ${serverId}`);
            // Check if the server is actually running
            try {
                existingServer.server.address();
                return existingServer.wss;
            }
            catch (error) {
                console.error(`[DEBUG] Existing server ${serverId} appears to be dead, recreating...`);
                await this.closeServer(serverId);
            }
        }
        console.error(`[DEBUG] Creating new server with ID: ${serverId} on port ${config.port}`);
        return new Promise((resolve, reject) => {
            try {
                const server = http.createServer((req, res) => {
                    if (req.url === '/health') {
                        res.writeHead(200);
                        res.end('OK');
                    }
                    else {
                        res.writeHead(404);
                        res.end();
                    }
                });
                const wss = new WebSocket.Server({ server, path: config.path });
                const clients = new Map();
                server.on('error', (error) => {
                    console.error(`[DEBUG] Server error for ${serverId}:`, error);
                    this.removeServer(serverId);
                    reject(error);
                });
                wss.on('connection', (ws, req) => {
                    ws.id = Math.random().toString(36).substring(7);
                    ws.isAlive = true;
                    clients.set(ws.id, ws);
                    console.error(`[DEBUG] New client connected. Server ID: ${serverId}, Client ID: ${ws.id}`);
                    this.listServers();
                    ws.on('pong', () => {
                        ws.isAlive = true;
                    });
                    ws.on('message', (data) => {
                        let message;
                        try {
                            message = JSON.parse(data.toString());
                        }
                        catch (error) {
                            message = data.toString();
                        }
                        console.error(`[DEBUG] Received message from client ${ws.id} on server ${serverId}`);
                        wss.emit('message', {
                            message,
                            timestamp: new Date().toISOString(),
                            clientId: ws.id,
                            serverId: serverId,
                        });
                    });
                    ws.on('close', () => {
                        console.error(`[DEBUG] Client disconnected. Server ID: ${serverId}, Client ID: ${ws.id}`);
                        clients.delete(ws.id);
                        this.listServers();
                    });
                    ws.on('error', () => {
                        console.error(`[DEBUG] Client error. Server ID: ${serverId}, Client ID: ${ws.id}`);
                        clients.delete(ws.id);
                        this.listServers();
                    });
                });
                server.listen(config.port, () => {
                    console.error(`[DEBUG] WebSocket server is running on port ${config.port} with ID ${serverId}`);
                    // Set up the heartbeat interval
                    const interval = setInterval(() => {
                        wss.clients.forEach((ws) => {
                            const client = ws;
                            if (client.isAlive === false) {
                                console.error(`[DEBUG] Removing dead client. Server ID: ${serverId}, Client ID: ${client.id}`);
                                clients.delete(client.id);
                                return client.terminate();
                            }
                            client.isAlive = false;
                            client.ping();
                        });
                    }, 30000);
                    // Store the interval for cleanup
                    const instance = { server, wss, clients, config, heartbeat: interval };
                    this.servers.set(serverId, instance);
                    console.error(`[DEBUG] Server created and stored with ID: ${serverId}`);
                    this.listServers();
                    resolve(wss);
                });
            }
            catch (error) {
                console.error(`[DEBUG] Failed to create server ${serverId}:`, error);
                reject(error);
            }
        });
    }
    async closeServer(serverId) {
        console.error(`[DEBUG] Attempting to close server with ID: ${serverId}`);
        const instance = this.servers.get(serverId);
        if (instance) {
            try {
                if (instance.heartbeat) {
                    clearInterval(instance.heartbeat);
                }
                instance.wss.close();
                instance.server.close();
                instance.clients.clear();
                this.servers.delete(serverId);
                console.error(`[DEBUG] Server closed successfully. ID: ${serverId}`);
            }
            catch (error) {
                console.error(`[DEBUG] Error closing server ${serverId}:`, error);
                // Clean up anyway
                this.servers.delete(serverId);
            }
        }
        else {
            console.error(`[DEBUG] No server found to close. ID: ${serverId}`);
        }
        this.listServers();
    }
    getServer(serverId) {
        console.error(`[DEBUG] Attempting to get server with ID: ${serverId}`);
        const server = this.servers.get(serverId);
        if (server) {
            try {
                // Verify the server is actually running
                server.server.address();
                console.error(`[DEBUG] Found server with ID: ${serverId}`);
                return server;
            }
            catch (error) {
                console.error(`[DEBUG] Server ${serverId} exists but appears to be dead`);
                this.servers.delete(serverId);
                return undefined;
            }
        }
        console.error(`[DEBUG] No server found with ID: ${serverId}`);
        return undefined;
    }
    removeServer(serverId) {
        console.log(`Removing server with ID: ${serverId}`);
        this.servers.delete(serverId);
        this.listServers();
    }
}
exports.WebSocketRegistry = WebSocketRegistry;
//# sourceMappingURL=WebSocketRegistry.js.map