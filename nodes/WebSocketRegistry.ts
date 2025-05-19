import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';

interface IServerInfo {
	port: number;
	path: string;
	clients: Map<string, WebSocket>;
	activeExecutions?: Set<string>; // Track active workflow executions
}

interface IServerConfig {
	port: number;
	path: string;
}

interface IServerEntry {
	wss: WebSocket.Server;
	clients: Map<string, WebSocket>;
	activeExecutions?: Set<string>; // Track active workflow executions
}

export class WebSocketRegistry {
	private static instance: WebSocketRegistry;
	private servers: Map<string, IServerEntry>;
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
			console.error('[DEBUG-REGISTRY] Error loading registry:', error);
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
			console.error('[DEBUG-REGISTRY] Error saving registry:', error);
		}
	}

	private createServer(serverId: string, config: IServerConfig) {
		console.error(`[DEBUG-REGISTRY] Creating WebSocket server on port ${config.port} with path ${config.path}`);
		
		const wss = new WebSocket.Server({ 
			port: config.port,
			path: config.path
		});

		const clients = new Map<string, WebSocket>();
		const activeExecutions = new Set<string>(); // Track active workflow executions
		
		// Set up ping interval to keep connections alive
		const pingInterval = setInterval(() => {
			if (clients.size === 0) {
				return;
			}
			
			console.error(`[DEBUG-REGISTRY] Sending ping to ${clients.size} clients on server ${serverId}`);
			clients.forEach((client, clientId) => {
				if (client.readyState === WebSocket.OPEN) {
					try {
						// Send a ping to keep the connection alive
						client.ping();
						console.error(`[DEBUG-REGISTRY] Ping sent to client ${clientId}`);
					} catch (error) {
						console.error(`[DEBUG-REGISTRY] Error sending ping to client ${clientId}:`, error);
					}
				} else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
					// Clean up dead connections
					console.error(`[DEBUG-REGISTRY] Removing dead client ${clientId} from server ${serverId}`);
					clients.delete(clientId);
					this.saveRegistry();
				}
			});
		}, 30000); // Send a ping every 30 seconds

		wss.on('connection', (ws: WebSocket) => {
			const clientId = Math.random().toString(36).substring(2, 8);
			clients.set(clientId, ws);

			console.error(`[DEBUG-REGISTRY] New client connected. Server ID: ${serverId}, Client ID: ${clientId}`);
			console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`);
			this.listClients(serverId);
			
			// Set up client-side ping/pong handling
			ws.on('ping', () => {
				// Respond to pings from the client
				if (ws.readyState === WebSocket.OPEN) {
					ws.pong();
				}
			});
			
			ws.on('pong', () => {
				// Client responded to our ping
				console.error(`[DEBUG-REGISTRY] Received pong from client ${clientId}`);
			});

			ws.on('message', (message: WebSocket.Data) => {
				console.error(`[DEBUG-REGISTRY] Received message from client ${clientId} on server ${serverId}`);
				try {
					const data = JSON.parse(message.toString());
					wss.emit('message', { ...data, clientId });
				} catch (error) {
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

		// Add a handler for server close to clean up the ping interval
		const originalClose = wss.close;
		wss.close = function(...args) {
			clearInterval(pingInterval);
			console.error(`[DEBUG-REGISTRY] Stopping ping interval for server ${serverId}`);
			return originalClose.apply(this, args);
		};

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

	public async closeServer(serverId: string, options: { keepClientsAlive?: boolean, executionId?: string } = {}): Promise<void> {
		const keepClientsAlive = options.keepClientsAlive !== false; // Default to true unless explicitly set to false
		const executionId = options.executionId;
		
		console.error(`[DEBUG-REGISTRY] Attempting to close server with ID: ${serverId}. Keep clients alive: ${keepClientsAlive}, Execution ID: ${executionId || 'none'}`);
		const server = this.servers.get(serverId);
		
		if (server) {
			// If we have an executionId, track it for this server
			if (executionId && !server.activeExecutions) {
				server.activeExecutions = new Set<string>();
			}
			
			// Register execution as active
			if (executionId && server.activeExecutions) {
				server.activeExecutions.add(executionId);
				console.error(`[DEBUG-REGISTRY] Registered execution ${executionId} for server ${serverId}. Active executions: ${server.activeExecutions.size}`);
			}
			
			// Remove this execution from tracking if it's being closed
			if (executionId && server.activeExecutions && !keepClientsAlive) {
				server.activeExecutions.delete(executionId);
				console.error(`[DEBUG-REGISTRY] Removed execution ${executionId} from server ${serverId}. Remaining executions: ${server.activeExecutions.size}`);
			}
			
			// If there are active executions, always keep clients alive regardless of the passed parameter
			const hasActiveExecutions = server.activeExecutions !== undefined && server.activeExecutions.size > 0;
			const shouldKeepAlive = keepClientsAlive || hasActiveExecutions;
			
			if (hasActiveExecutions) {
				console.error(`[DEBUG-REGISTRY] Server ${serverId} has ${server.activeExecutions?.size} active executions - forcing keepClientsAlive to true`);
			}

			if (!shouldKeepAlive) {
				// Close all client connections
				server.clients.forEach((client) => {
					try {
						client.close();
					} catch (error) {
						console.error(`[DEBUG-REGISTRY] Error closing client connection:`, error);
					}
				});
			} else {
				console.error(`[DEBUG-REGISTRY] Keeping ${server.clients.size} clients alive for server ${serverId}`);
			}

			// In soft close mode, we don't want to close the WSS server,
			// just mark it as inactive to keep connections alive
			if (!shouldKeepAlive) {
				// Close the server fully
				await new Promise<void>((resolve) => {
					server.wss.close(() => {
						console.error(`[DEBUG-REGISTRY] Server fully closed. ID: ${serverId}`);
						resolve();
					});
				});
				
				this.servers.delete(serverId);
				console.error(`[DEBUG-REGISTRY] Server closed successfully. ID: ${serverId}`);
			} else {
				// For soft close, we keep the server entry and all connections
				console.error(`[DEBUG-REGISTRY] Server soft-closed, connections maintained for ${serverId}`);
			}
			
			this.saveRegistry();
		}
	}

	public listServers(): void {
		this.loadRegistry(); // Reload registry to get latest state
		
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

	private listClients(serverId: string): void {
		const server = this.servers.get(serverId);
		if (server) {
			server.clients.forEach((_, clientId) => {
				console.error(`[DEBUG-REGISTRY]   - Client ID: ${clientId}`);
			});
		}
	}

	public broadcastToServer(serverId: string, message: string, callback?: (client: WebSocket) => void): void {
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
			} catch (error) {
				console.error(`[DEBUG-REGISTRY] Error sending message to client ${clientId}:`, error);
			}
		});
	}

	public registerExecution(serverId: string, executionId: string): void {
		const server = this.servers.get(serverId);
		if (server) {
			if (!server.activeExecutions) {
				server.activeExecutions = new Set<string>();
			}
			server.activeExecutions.add(executionId);
			console.error(`[DEBUG-REGISTRY] Registered execution ${executionId} for server ${serverId}. Active executions: ${server.activeExecutions.size}`);
		}
	}
	
	public unregisterExecution(serverId: string, executionId: string): void {
		const server = this.servers.get(serverId);
		if (server && server.activeExecutions) {
			server.activeExecutions.delete(executionId);
			console.error(`[DEBUG-REGISTRY] Unregistered execution ${executionId} from server ${serverId}. Remaining executions: ${server.activeExecutions.size}`);
		}
	}
} 