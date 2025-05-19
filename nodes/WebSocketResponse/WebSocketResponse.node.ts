import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { WebSocketRegistry } from '../WebSocketRegistry';

export class WebSocketResponse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WebSocket Response',
		name: 'webSocketResponse',
		icon: 'fa:plug',
		group: ['transform'],
		version: 1,
		description: 'Sends a response to a WebSocket client',
		defaults: {
			name: 'WebSocket Response',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Response Data',
				name: 'responseData',
				type: 'string',
				default: '',
				required: true,
				description: 'The data to send as a response',
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
						value: 'This node sends responses back to WebSocket clients connected to this workflow.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const MAX_RETRIES = 3;
		const RETRY_DELAY = 1000; // 1 second

		const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const responseData = this.getNodeParameter('responseData', i) as string;

			// Get server and client IDs from the input
			let serverId = item.json.serverId as string;
			const clientId = item.json.clientId as string;
			const port = item.json.port as number;
			const workflowId = this.getWorkflow().id;

			console.error(`[DEBUG] Processing WebSocket Response - Input data:`, JSON.stringify(item.json, null, 2));

			// Handle legacy server IDs (ws-{port})
			if (serverId && serverId.startsWith('ws-') && port) {
				const newServerId = `ws-${workflowId}`;
				console.error(`[DEBUG] Converting legacy server ID ${serverId} to new format ${newServerId}`);
				serverId = newServerId;
			}

			if (!serverId || !clientId) {
				console.error(`[DEBUG] Missing serverId or clientId in input data:`, item.json);
				throw new Error('Missing serverId or clientId in the input data');
			}

			console.error(`[DEBUG] Processing WebSocket Response ===`);
			console.error(`[DEBUG] Server ID: ${serverId}`);
			console.error(`[DEBUG] Client ID: ${clientId}`);

			let lastError: Error | null = null;
			let success = false;

			// Try multiple times to get the server and send the response
			for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
				try {
					if (attempt > 0) {
						console.error(`[DEBUG] Retry attempt ${attempt + 1} for server ${serverId}`);
						await sleep(RETRY_DELAY);
					}

					const registry = WebSocketRegistry.getInstance();
					console.error(`[DEBUG] Current WebSocket Servers ===`);
					registry.listServers();

					const client = registry.getClient(serverId, clientId);
					if (!client) {
						// Try legacy server ID if new format fails
						if (port && serverId !== `ws-${port}`) {
							console.error(`[DEBUG] Trying legacy server ID ws-${port}`);
							const legacyClient = registry.getClient(`ws-${port}`, clientId);
							if (legacyClient) {
								console.error(`[DEBUG] Found client using legacy server ID`);
								lastError = null;
								const response = typeof responseData === 'object' ? JSON.stringify(responseData) : responseData;
								await new Promise<void>((resolve, reject) => {
									legacyClient.send(response, (err?: Error) => {
										if (err) {
											console.error(`[DEBUG] Error sending response on attempt ${attempt + 1}:`, err);
											reject(err);
										} else {
											resolve();
										}
									});
								});
								console.error(`[DEBUG] Response sent to client ${clientId} on legacy server ws-${port}`);
								success = true;
								returnData.push(item);
								break;
							}
						}
						lastError = new Error(`WebSocket client ${clientId} not found on server ${serverId}`);
						console.error(`[DEBUG] Client not found on attempt ${attempt + 1}`);
						continue;
					}

					// Send the response
					const response = typeof responseData === 'object' ? JSON.stringify(responseData) : responseData;
					await new Promise<void>((resolve, reject) => {
						client.send(response, (err?: Error) => {
							if (err) {
								console.error(`[DEBUG] Error sending response on attempt ${attempt + 1}:`, err);
								reject(err);
							} else {
								resolve();
							}
						});
					});

					console.error(`[DEBUG] Response sent to client ${clientId} on server ${serverId}`);
					success = true;
					returnData.push(item);
					break;

				} catch (error) {
					console.error(`[DEBUG] Error on attempt ${attempt + 1}:`, error);
					lastError = error as Error;
				}
			}

			if (!success && lastError) {
				throw lastError;
			}
		}

		return [returnData];
	}
} 