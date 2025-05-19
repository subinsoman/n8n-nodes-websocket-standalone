import {
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	ITriggerFunctions,
} from 'n8n-workflow';
import { WebSocketRegistry } from '../WebSocketRegistry';

export class WebSocketTrigger implements INodeType {
	description: INodeTypeDescription = {
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
				displayName: 'Port',
				name: 'port',
				type: 'number',
				default: 5680,
				required: true,
				description: 'The port to listen on',
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '/ws',
				required: true,
				description: 'The WebSocket server path',
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
						value: 'The WebSocket server will be available at: ws://localhost:{port}{path}',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const port = this.getNodeParameter('port') as number;
		const path = this.getNodeParameter('path') as string;
		
		// Generate server ID with port
		const serverId = `ws-${port}`;
		console.error(`[DEBUG] Creating WebSocket server with ID: ${serverId}`);

		const registry = WebSocketRegistry.getInstance();
		console.error(`[DEBUG] Current WebSocket Servers (Before Creation) ===`);
		registry.listServers();

		try {
			// Close any existing server on this port
			await registry.closeServer(serverId);
			
			const wss = await registry.getOrCreateServer(serverId, { port, path });
			console.error(`[DEBUG] WebSocket server created/retrieved successfully`);

			const executeTrigger = async (data: any) => {
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
				} catch (error) {
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
		} catch (error) {
			console.error(`[DEBUG] Error in WebSocket trigger:`, error);
			throw error;
		}
	}
} 