import {
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	ITriggerFunctions,
	INodeParameters,
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
						value: 'The WebSocket server will be available at: ws://localhost:5678/workflow/{workflowId}',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const workflowId = this.getWorkflow().id;
		const path = `/workflow/${workflowId}`;
		
		// Generate server ID with the exact format expected by the response node
		const serverId = `ws-${workflowId}`;
		console.error(`[DEBUG] Creating WebSocket server with ID: ${serverId}`);

		const registry = WebSocketRegistry.getInstance();
		console.error(`[DEBUG] Current WebSocket Servers (Before Creation) ===`);
		registry.listServers();

		try {
			// Close any existing server for this workflow
			await registry.closeServer(serverId);
			
			const wss = await registry.getOrCreateServer(serverId, { path });
			console.error(`[DEBUG] WebSocket server created/retrieved successfully`);

			const executeTrigger = async (data: any) => {
				try {
					// Include both serverId and clientId in the output
					const outputData = {
						...data, 
						serverId,
						path,
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