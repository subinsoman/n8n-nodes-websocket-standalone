"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketRegistry = void 0;
const ws_1 = __importDefault(require("ws"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class WebSocketRegistry {
    constructor() {
        this.servers = new Map();
        this.registryPath = path_1.default.join(os_1.default.tmpdir(), 'n8n-websocket-registry.json');
        this.loadRegistry();
    }
    static getInstance() {
        if (!WebSocketRegistry.instance) {
            WebSocketRegistry.instance = new WebSocketRegistry();
        }
        return WebSocketRegistry.instance;
    }
    loadRegistry() {
        try {
            if (fs_1.default.existsSync(this.registryPath)) {
                const data = JSON.parse(fs_1.default.readFileSync(this.registryPath, 'utf8'));
                Object.entries(data).forEach(([serverId, serverInfo]) => {
                    if (!this.servers.has(serverId)) {
                        this.createServer(serverId, {
                            port: serverInfo.port,
                            path: serverInfo.path,
                        });
                    }
                });
            }
        }
        catch (error) {
            console.error('[DEBUG-REGISTRY] Error loading registry:', error);
        }
    }
    saveRegistry() {
        try {
            const data = {};
            this.servers.forEach(({ wss, clients }, serverId) => {
                const address = wss.address();
                if (address && typeof address === 'object') {
                    data[serverId] = {
                        port: address.port,
                        path: wss.options.path,
                        clients: clients,
                    };
                }
            });
            fs_1.default.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('[DEBUG-REGISTRY] Error saving registry:', error);
        }
    }
    createServer(serverId, config) {
        console.error(`[DEBUG-REGISTRY] Creating WebSocket server on port ${config.port} with path ${config.path}`);
        const wss = new ws_1.default.Server({
            port: config.port,
            path: config.path
        });
        const clients = new Map();
        const pingInterval = setInterval(() => {
            if (clients.size === 0) {
                return;
            }
            console.error(`[DEBUG-REGISTRY] Sending ping to ${clients.size} clients on server ${serverId}`);
            clients.forEach((client, clientId) => {
                if (client.readyState === ws_1.default.OPEN) {
                    try {
                        client.ping();
                        console.error(`[DEBUG-REGISTRY] Ping sent to client ${clientId}`);
                    }
                    catch (error) {
                        console.error(`[DEBUG-REGISTRY] Error sending ping to client ${clientId}:`, error);
                    }
                }
                else if (client.readyState === ws_1.default.CLOSED || client.readyState === ws_1.default.CLOSING) {
                    console.error(`[DEBUG-REGISTRY] Removing dead client ${clientId} from server ${serverId}`);
                    clients.delete(clientId);
                    this.saveRegistry();
                }
            });
        }, 30000);
        wss.on('connection', (ws) => {
            const clientId = Math.random().toString(36).substring(2, 8);
            clients.set(clientId, ws);
            console.error(`[DEBUG-REGISTRY] New client connected. Server ID: ${serverId}, Client ID: ${clientId}`);
            console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`);
            this.listClients(serverId);
            ws.on('ping', () => {
                if (ws.readyState === ws_1.default.OPEN) {
                    ws.pong();
                }
            });
            ws.on('pong', () => {
                console.error(`[DEBUG-REGISTRY] Received pong from client ${clientId}`);
            });
            ws.on('message', (message) => {
                console.error(`[DEBUG-REGISTRY] Received message from client ${clientId} on server ${serverId}`);
                try {
                    const data = JSON.parse(message.toString());
                    wss.emit('message', { ...data, clientId });
                }
                catch (error) {
                    wss.emit('message', { message: message.toString(), clientId });
                }
            });
            ws.on('close', () => {
                clients.delete(clientId);
                console.error(`[DEBUG-REGISTRY] Client ${clientId} disconnected from server ${serverId}`);
                console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`);
                this.listClients(serverId);
                this.saveRegistry();
            });
            ws.on('error', (error) => {
                console.error(`[DEBUG-REGISTRY] WebSocket error for client ${clientId}:`, error);
            });
        });
        const originalClose = wss.close;
        wss.close = function (...args) {
            clearInterval(pingInterval);
            console.error(`[DEBUG-REGISTRY] Stopping ping interval for server ${serverId}`);
            return originalClose.apply(this, args);
        };
        this.servers.set(serverId, { wss, clients });
        this.saveRegistry();
        return wss;
    }
    async getOrCreateServer(serverId, config) {
        this.loadRegistry();
        const server = this.servers.get(serverId);
        if (server) {
            return server.wss;
        }
        return this.createServer(serverId, config);
    }
    getServer(serverId) {
        var _a;
        this.loadRegistry();
        return (_a = this.servers.get(serverId)) === null || _a === void 0 ? void 0 : _a.wss;
    }
    getClient(serverId, clientId) {
        const server = this.servers.get(serverId);
        return server === null || server === void 0 ? void 0 : server.clients.get(clientId);
    }
    async closeServer(serverId, options = {}) {
        console.error(`[DEBUG-REGISTRY] Attempting to close server with ID: ${serverId}. Keep clients alive: ${options.keepClientsAlive}`);
        const server = this.servers.get(serverId);
        if (server) {
            if (!options.keepClientsAlive) {
                server.clients.forEach((client) => {
                    try {
                        client.close();
                    }
                    catch (error) {
                        console.error(`[DEBUG-REGISTRY] Error closing client connection:`, error);
                    }
                });
            }
            else {
                console.error(`[DEBUG-REGISTRY] Keeping clients alive for server ${serverId} as requested`);
            }
            await new Promise((resolve) => {
                server.wss.close(() => {
                    console.error(`[DEBUG-REGISTRY] Server closed successfully. ID: ${serverId}`);
                    resolve();
                });
            });
            if (!options.keepClientsAlive) {
                this.servers.delete(serverId);
            }
            else {
                console.error(`[DEBUG-REGISTRY] Keeping server entry for ${serverId} to maintain client references`);
            }
            this.saveRegistry();
        }
    }
    listServers() {
        this.loadRegistry();
        console.error('=== [DEBUG-REGISTRY] Available WebSocket Servers ===');
        this.servers.forEach(({ wss, clients }, serverId) => {
            const address = wss.address();
            if (address && typeof address === 'object') {
                console.error(`[DEBUG-REGISTRY] Server ID: ${serverId}`);
                console.error(`[DEBUG-REGISTRY] Port: ${address.port}`);
                console.error(`[DEBUG-REGISTRY] Path: ${wss.options.path}`);
                console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`);
                this.listClients(serverId);
            }
        });
        console.error('=== [DEBUG-REGISTRY] End of Server List ===');
    }
    listClients(serverId) {
        const server = this.servers.get(serverId);
        if (server) {
            server.clients.forEach((_, clientId) => {
                console.error(`[DEBUG-REGISTRY]   - Client ID: ${clientId}`);
            });
        }
    }
    broadcastToServer(serverId, message, callback) {
        const server = this.servers.get(serverId);
        if (!server) {
            console.error(`[DEBUG-REGISTRY] Server with ID ${serverId} not found for broadcast`);
            return;
        }
        console.error(`[DEBUG-REGISTRY] Broadcasting message to server ${serverId} with ${server.clients.size} clients`);
        server.clients.forEach((client, clientId) => {
            try {
                client.send(message);
                if (callback) {
                    callback(client);
                }
                console.error(`[DEBUG-REGISTRY] Message sent to client ${clientId}`);
            }
            catch (error) {
                console.error(`[DEBUG-REGISTRY] Error sending message to client ${clientId}:`, error);
            }
        });
    }
}
exports.WebSocketRegistry = WebSocketRegistry;
//# sourceMappingURL=WebSocketRegistry.js.map