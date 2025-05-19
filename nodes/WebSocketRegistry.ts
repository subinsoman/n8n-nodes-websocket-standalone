import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface IServerInfo {
	port: number;
	path: string;
	clients: Map<string, WebSocket>;
}

interface IServerConfig {
	port: number;
	path: string;
}

export class WebSocketRegistry {
	private static instance: WebSocketRegistry;
	private servers: Map<string, { wss: WebSocket.Server; clients: Map<string, WebSocket> }>;
	private readonly registryPath: string;

	private constructor() {
		this.servers = new Map();
		this.registryPath = path.join(os.tmpdir(), 'n8n-websocket-registry.json');
		this.loadRegistry();
	}

	public static getInstance(): WebSocketRegistry {
		if (!WebSocketRegistry.instance) {
			WebSocketRegistry.instance = new WebSocketRegistry();
		}
		return WebSocketRegistry.instance;
	}

	private loadRegistry() {
		try {
			if (fs.existsSync(this.registryPath)) {
				const data = JSON.parse(fs.readFileSync(this.registryPath, 'utf8')) as Record<string, IServerInfo>;
				// Recreate servers from stored configurations
				Object.entries(data).forEach(([serverId, serverInfo]) => {
					if (!this.servers.has(serverId)) {
						this.createServer(serverId, {
							port: serverInfo.port,
							path: serverInfo.path,
						});
					}
				});
			}
		} catch (error) {
			console.error('[DEBUG] Error loading registry:', error);
		}
	}

	private saveRegistry() {
		try {
			const data: { [key: string]: IServerInfo } = {};
			this.servers.forEach(({ wss, clients }, serverId) => {
				const address = wss.address();
				if (address && typeof address === 'object') {
					data[serverId] = {
						port: address.port,
						path: wss.options.path as string,
						clients: clients,
					};
				}
			});
			fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
		} catch (error) {
			console.error('[DEBUG] Error saving registry:', error);
		}
	}

	private createServer(serverId: string, config: IServerConfig) {
		const wss = new WebSocket.Server(config);
		const clients = new Map<string, WebSocket>();

		wss.on('connection', (ws: WebSocket) => {
			const clientId = Math.random().toString(36).substring(2, 8);
			clients.set(clientId, ws);

			console.error(`[DEBUG] New client connected. Server ID: ${serverId}, Client ID: ${clientId}`);
			console.error(`[DEBUG] Active Clients: ${clients.size}`);
			this.listClients(serverId);

			ws.on('message', (message: WebSocket.Data) => {
				console.error(`[DEBUG] Received message from client ${clientId} on server ${serverId}`);
				try {
					const data = JSON.parse(message.toString());
					wss.emit('message', { ...data, clientId });
				} catch (error) {
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

	public async getOrCreateServer(serverId: string, config: IServerConfig): Promise<WebSocket.Server> {
		this.loadRegistry(); // Reload registry to get latest state
		
		const server = this.servers.get(serverId);
		if (server) {
			return server.wss;
		}

		return this.createServer(serverId, config);
	}

	public getServer(serverId: string): WebSocket.Server | undefined {
		this.loadRegistry(); // Reload registry to get latest state
		return this.servers.get(serverId)?.wss;
	}

	public getClient(serverId: string, clientId: string): WebSocket | undefined {
		const server = this.servers.get(serverId);
		return server?.clients.get(clientId);
	}

	public async closeServer(serverId: string): Promise<void> {
		console.error(`[DEBUG] Attempting to close server with ID: ${serverId}`);
		const server = this.servers.get(serverId);
		
		if (server) {
			// Close all client connections
			server.clients.forEach((client) => {
				try {
					client.close();
				} catch (error) {
					console.error(`[DEBUG] Error closing client connection:`, error);
				}
			});

			// Close the server
			await new Promise<void>((resolve) => {
				server.wss.close(() => {
					console.error(`[DEBUG] Server closed successfully. ID: ${serverId}`);
					resolve();
				});
			});

			this.servers.delete(serverId);
			this.saveRegistry();
		}
	}

	public listServers(): void {
		this.loadRegistry(); // Reload registry to get latest state
		
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

	private listClients(serverId: string): void {
		const server = this.servers.get(serverId);
		if (server) {
			server.clients.forEach((_, clientId) => {
				console.error(`  - Client ID: ${clientId}`);
			});
		}
	}
} 