import {
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	ITriggerFunctions,
} from 'n8n-workflow';
import { WebSocketRegistry } from '../WebSocketRegistry';

// Create a global store for execution context
if (!(global as any).websocketExecutionContext) {
	(global as any).websocketExecutionContext = {
		servers: {}
	};
}

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
				displayName: 'Connection ID',
				name: 'connectionId',
				type: 'string',
				default: '',
				required: false,
				description: 'Optional custom connection ID. If not provided, the port will be used',
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
		const customConnectionId = this.getNodeParameter('connectionId', '') as string;
		
		// Get execution and node IDs for context tracking
		const executionId = this.getExecutionId();
		const nodeId = this.getNode().id;
		
		// Generate server ID with additional context info
		const connectionId = customConnectionId || `${port}`;
		const serverId = `ws-${connectionId}`;
		
		console.error(`[DEBUG-TRIGGER] Creating WebSocket server with ID: ${serverId}`);
		console.error(`[DEBUG-TRIGGER] Execution ID: ${executionId}, Node ID: ${nodeId}`);

		// Use global context instead of workflow context
		const context = (global as any).websocketExecutionContext;
		if (!context.servers) {
			context.servers = {};
		}
		
		const registry = WebSocketRegistry.getInstance();
		console.error(`[DEBUG-TRIGGER] Current WebSocket Servers (Before Creation) ===`);
		registry.listServers();

		try {
			// Close any existing server on this port
			await registry.closeServer(serverId);
			
			// Create or get server
			const wss = await registry.getOrCreateServer(serverId, { port, path });
			console.error(`[DEBUG-TRIGGER] WebSocket server created/retrieved successfully`);
			
			// Store in context
			context.servers[serverId] = { 
				serverId, 
				port, 
				path, 
				nodeId, 
				executionId,
				active: true 
			};
			
			console.error(`[DEBUG-TRIGGER] Server added to execution context: ${JSON.stringify(context.servers[serverId])}`);

			const executeTrigger = async (data: any) => {
				try {
					// Include both serverId and clientId in the output
					const outputData = {
						...data, 
						serverId,
						path,
						port,
						nodeId,
						executionId,
						clientId: data.clientId,
						contextInfo: context.servers[serverId]
					};
					
					console.error(`[DEBUG-TRIGGER] Received message. Server ID: ${serverId}, Client ID: ${data.clientId}`);
					this.emit([this.helpers.returnJsonArray([outputData])]);
				} catch (error) {
					console.error(`[DEBUG-TRIGGER] Error in trigger execution:`, error);
				}
			};

			wss.on('message', executeTrigger);

			// Verify the server is running
			const server = registry.getServer(serverId);
			if (!server) {
				throw new Error(`Failed to verify server ${serverId} is running`);
			}

			// Store a reference to the ITriggerFunctions instance for closeFunction to use
			const self = this;

			async function closeFunction() {
				console.error(`[DEBUG-TRIGGER] Closing WebSocket server with ID: ${serverId}`);
				
				// Update context to mark server as inactive
				if (context.servers && context.servers[serverId]) {
					context.servers[serverId].active = false;
				}
				
				// Check if this is a final workflow cleanup (deactivation/deletion)
				// This check isn't fully reliable, but helps prevent closing in most normal executions
				const isWorkflowEnd = self.getWorkflow !== undefined;
				console.error(`[DEBUG-TRIGGER] Is workflow end: ${isWorkflowEnd}`);
				
				if (isWorkflowEnd) {
					// Only fully close the server if the workflow is being deactivated/deleted
					await registry.closeServer(serverId);
					console.error(`[DEBUG-TRIGGER] Fully closed server due to workflow deactivation/deletion`);
				} else {
					// For normal execution completion, use soft close to keep clients alive
					await registry.closeServer(serverId, { keepClientsAlive: true });
					console.error(`[DEBUG-TRIGGER] Soft-closed server to keep connections open for response nodes`);
				}
			}

			return {
				closeFunction,
			};
		} catch (error) {
			console.error(`[DEBUG-TRIGGER] Error in WebSocket trigger:`, error);
			throw error;
		}
	}
} 