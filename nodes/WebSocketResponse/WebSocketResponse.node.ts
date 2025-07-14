import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { WebSocketRegistry } from '../WebSocketRegistry';
import WebSocket from 'ws';

// Ensure global context exists
if (!(global as any).websocketExecutionContext) {
	(global as any).websocketExecutionContext = {
		servers: {}
	};
}

export class WebSocketResponse implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		const registry = WebSocketRegistry.getInstance();
		
		// Get execution ID for tracking
		const executionId = this.getExecutionId() || 'unknown';
		const nodeId = this.getNode().id;
		
		// Get global context for tracking WebSocket connections
		const executionContext = (global as any).websocketExecutionContext;
		if (!executionContext.servers) {
			executionContext.servers = {};
		}
		
		// Get servers from registry
		console.error('[DEBUG-RESPONSE] Current WebSocket Servers ===');
		registry.listServers();
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				// Determine Server ID
				const connectionMethod = this.getNodeParameter('connectionMethod', i) as string;
				let serverId: string;
				
				switch(connectionMethod) {
					case 'custom':
						serverId = this.getNodeParameter('customServerId', i) as string;
						break;
					case 'fromContext':
						// Get the first active server from context
						const activeServers = Object.entries(executionContext.servers || {})
							.filter(([_, info]: [string, any]) => info.active === true);
							
						if (activeServers.length === 0) {
							throw new Error('No active WebSocket servers found in execution context');
						}
						serverId = activeServers[0][0];
						break;
					case 'fromInput':
					default:
						const serverIdProperty = this.getNodeParameter('serverIdProperty', i) as string;
						serverId = items[i].json[serverIdProperty] as string;
				}
				
				// Register this execution with the server to prevent premature closing
				registry.registerExecution(serverId, executionId);
				
				// Check if the server exists
				const wss = registry.getServer(serverId);
				if (!wss) {
					throw new Error(`WebSocket server with ID ${serverId} not found`);
				}

				// Determine Client ID
				const clientMethod = this.getNodeParameter('clientMethod', i) as string;
				let clientId: string | undefined;
				
				switch(clientMethod) {
					case 'custom':
						clientId = this.getNodeParameter('customClientId', i) as string;
						break;
					case 'broadcast':
						clientId = undefined; // broadcast to all clients
						break;
					case 'fromInput':
					default:
						const clientIdProperty = this.getNodeParameter('clientIdProperty', i) as string;
						clientId = items[i].json[clientIdProperty] as string;
				}

				// Prepare message data
				const isJsonResponse = this.getNodeParameter('jsonResponse', i) as boolean;
				let messageData: string;
				
				if (isJsonResponse) {
					const responseJson = this.getNodeParameter('responseJson', i);
					messageData = JSON.stringify(responseJson);
				} else {
					messageData = this.getNodeParameter('responseData', i) as string;
				}

				// Send the message
				if (clientId) {
					// Send to specific client
					const client = registry.getClient(serverId, clientId);
					if (!client) {
						throw new Error(`Client with ID ${clientId} not found on server ${serverId}`);
					}
					
					// Send with retry logic
					let success = false;
					let lastError: Error | undefined;
					const maxRetries = 3;
					const retryDelay = 500;
					
					for (let attempt = 0; attempt < maxRetries; attempt++) {
						try {
							if (attempt > 0) {
								console.error(`[DEBUG-RESPONSE] Retry attempt ${attempt + 1} to send message`);
								await new Promise(resolve => setTimeout(resolve, retryDelay));
							}
							
							// Check connection state
							if (client.readyState !== WebSocket.OPEN) {
								throw new Error(`WebSocket not open (state: ${client.readyState})`);
							}
							
							// Send message with promise wrapper
							await new Promise<void>((resolve, reject) => {
								client.send(messageData, (error?: Error) => {
									if (error) {
										reject(error);
									} else {
										resolve();
									}
								});
							});
							
							console.error(`[DEBUG-RESPONSE] Message sent to client ${clientId} on server ${serverId}`);
							success = true;
							break;
						} catch (error: any) {
							lastError = error;
							console.error(`[DEBUG-RESPONSE] Error on attempt ${attempt + 1}:`, error.message);
						}
					}
					
					if (!success) {
						throw lastError || new Error('Failed to send message after retries');
					}
				} else {
					// Broadcast to all clients
					let clientCount = 0;
					registry.broadcastToServer(serverId, messageData, () => clientCount++);
					console.error(`[DEBUG-RESPONSE] Message broadcast to ${clientCount} clients on server ${serverId}`);
				}

				// Add server status to output data
				const outputItem = { ...items[i].json };
				outputItem.success = true;
				outputItem.serverId = serverId;
				outputItem.clientId = clientId || 'broadcast';
				
				// Add context info if available
				if (executionContext.servers && executionContext.servers[serverId]) {
					outputItem.serverInfo = executionContext.servers[serverId];
				}
				
				returnData.push({ json: outputItem });

				// Clear this execution from the registry after we're done
				registry.unregisterExecution(serverId, executionId);
				
			} catch (error: any) {
				// Handle errors
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