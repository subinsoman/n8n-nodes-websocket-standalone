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
            console.error('[DEBUG] Error loading registry:', error);
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
            console.error('[DEBUG] Error saving registry:', error);
        }
    }
    createServer(serverId, config) {
        console.error(`[DEBUG] Creating WebSocket server on port ${config.port} with path ${config.path}`);
        const wss = new ws_1.default.Server({
            port: config.port,
            path: config.path
        });
        const clients = new Map();
        wss.on('connection', (ws) => {
            const clientId = Math.random().toString(36).substring(2, 8);
            clients.set(clientId, ws);
            console.error(`[DEBUG] New client connected. Server ID: ${serverId}, Client ID: ${clientId}`);
            console.error(`[DEBUG] Active Clients: ${clients.size}`);
            this.listClients(serverId);
            ws.on('message', (message) => {
                console.error(`[DEBUG] Received message from client ${clientId} on server ${serverId}`);
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
                console.error(`[DEBUG] Client ${clientId} disconnected from server ${serverId}`);
                console.error(`[DEBUG] Active Clients: ${clients.size}`);
                this.listClients(serverId);
                this.saveRegistry();
            });
        });
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
    async closeServer(serverId) {
        console.error(`[DEBUG] Attempting to close server with ID: ${serverId}`);
        const server = this.servers.get(serverId);
        if (server) {
            server.clients.forEach((client) => {
                try {
                    client.close();
                }
                catch (error) {
                    console.error(`[DEBUG] Error closing client connection:`, error);
                }
            });
            await new Promise((resolve) => {
                server.wss.close(() => {
                    console.error(`[DEBUG] Server closed successfully. ID: ${serverId}`);
                    resolve();
                });
            });
            this.servers.delete(serverId);
            this.saveRegistry();
        }
    }
    listServers() {
        this.loadRegistry();
        console.error('=== Available WebSocket Servers ===');
        this.servers.forEach(({ wss, clients }, serverId) => {
            const address = wss.address();
            if (address && typeof address === 'object') {
                console.error(`Server ID: ${serverId}`);
                console.error(`Port: ${address.port}`);
                console.error(`Path: ${wss.options.path}`);
                console.error(`Active Clients: ${clients.size}`);
                this.listClients(serverId);
            }
        });
        console.error('================================');
    }
    listClients(serverId) {
        const server = this.servers.get(serverId);
        if (server) {
            server.clients.forEach((_, clientId) => {
                console.error(`  - Client ID: ${clientId}`);
            });
        }
    }
}
exports.WebSocketRegistry = WebSocketRegistry;
//# sourceMappingURL=WebSocketRegistry.js.map