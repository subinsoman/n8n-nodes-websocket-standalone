import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';

interface IServerInfo {
	path: string;
	clients: Map<string, WebSocket>;
}

interface IServerConfig {
	path: string;
}

export class WebSocketRegistry {
	private static instance: WebSocketRegistry;
	private servers: Map<string, { wss: WebSocket.Server; clients: Map<string, WebSocket> }>;
	private readonly registryPath: string;
	private readonly N8N_PORT = 5678;

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
				data[serverId] = {
					path: wss.options.path as string,
					clients: clients,
				};
			});
			fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2));
		} catch (error) {
			console.error('[DEBUG] Error saving registry:', error);
		}
	}

	private async findN8nServer(): Promise<http.Server | undefined> {
		return new Promise((resolve) => {
			// Try to connect to n8n server
			const testSocket = new WebSocket(`ws://localhost:${this.N8N_PORT}`);
			
			let resolved = false;
			
			testSocket.on('error', () => {
				if (!resolved) {
					resolved = true;
					testSocket.close();
					resolve(undefined);
				}
			});

			testSocket.on('open', () => {
				if (!resolved) {
					resolved = true;
					testSocket.close();
					// Since n8n server exists, we'll create a new HTTP server that will proxy requests
					const server = http.createServer();
					server.on('upgrade', (request, socket, head) => {
						// Forward the upgrade event to n8n server
						const n8nSocket = new WebSocket(`ws://localhost:${this.N8N_PORT}${request.url}`);
						
						n8nSocket.on('open', () => {
							// Forward messages from client to n8n
							socket.on('data', (data: Buffer) => {
								n8nSocket.send(data);
							});

							// Forward messages from n8n to client
							n8nSocket.on('message', (data: WebSocket.Data) => {
								socket.write(data.toString());
							});

							// Handle connection close
							socket.on('close', () => n8nSocket.close());
							n8nSocket.on('close', () => socket.end());

							// Complete WebSocket handshake
							socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
									   'Upgrade: websocket\r\n' +
									   'Connection: Upgrade\r\n' +
									   '\r\n');
						});
					});
					resolve(server);
				}
			});

			// Add timeout to prevent hanging
			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					testSocket.close();
					resolve(undefined);
				}
			}, 3000);
		});
	}

	private createServer(serverId: string, config: IServerConfig) {
		console.error(`[DEBUG] Creating WebSocket server with path ${config.path}`);
		
		const wss = new WebSocket.Server({ 
			noServer: true // Always use noServer mode
		});

		const clients = new Map<string, WebSocket>();

		// Handle upgrade requests
		const handleUpgrade = async (request: http.IncomingMessage, socket: any, head: Buffer) => {
			if (request.url === config.path) {
				try {
					wss.handleUpgrade(request, socket, head, (ws) => {
						wss.emit('connection', ws, request);
					});
				} catch (error) {
					console.error(`[DEBUG] Error handling upgrade:`, error);
					socket.destroy();
				}
			}
		};

		// Try to find n8n's server
		this.findN8nServer().then((server) => {
			if (server) {
				console.error(`[DEBUG] Attaching WebSocket server to n8n server on port ${this.N8N_PORT}`);
				server.on('upgrade', handleUpgrade);
			} else {
				console.error(`[DEBUG] Could not find n8n server, creating standalone WebSocket server`);
				// Create a new HTTP server for WebSocket
				const httpServer = http.createServer();
				httpServer.on('upgrade', handleUpgrade);
				
				httpServer.listen(this.N8N_PORT, () => {
					console.error(`[DEBUG] WebSocket server listening on port ${this.N8N_PORT}`);
				});

				httpServer.on('error', (error: any) => {
					if (error.code === 'EADDRINUSE') {
						console.error(`[DEBUG] Port ${this.N8N_PORT} is in use, trying next port`);
						const nextPort = this.N8N_PORT + 1;
						httpServer.listen(nextPort);
					} else {
						console.error(`[DEBUG] Server error:`, error);
					}
				});
			}
		});

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
			console.error(`Server ID: ${serverId}`);
			console.error(`Port: ${this.N8N_PORT}`);
			console.error(`Path: ${wss.options.path}`);
			console.error(`Active Clients: ${clients.size}`);
			this.listClients(serverId);
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