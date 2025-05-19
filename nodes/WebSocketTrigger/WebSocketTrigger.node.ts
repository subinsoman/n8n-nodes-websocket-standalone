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
			await registry.closeServer(serverId, { keepClientsAlive: true });
			
			// Create or get server
			const wss = await registry.getOrCreateServer(serverId, { port, path });
			console.error(`[DEBUG-TRIGGER] WebSocket server created/retrieved successfully`);
			
			// Register this execution with the server to prevent premature closing
			registry.registerExecution(serverId, executionId);
			
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
			const isManualTrigger = !!this.getNodeParameter('manualTrigger', false);

			// Mark if this is the first execution of this node
			if (!context.executionCounts) {
				context.executionCounts = {};
			}
			context.executionCounts[serverId] = (context.executionCounts[serverId] || 0) + 1;
			const executionCount = context.executionCounts[serverId];
			console.error(`[DEBUG-TRIGGER] Execution count for server ${serverId}: ${executionCount}`);

			async function closeFunction() {
				console.error(`[DEBUG-TRIGGER] Closing WebSocket server with ID: ${serverId}`);
				
				// Update context to mark server as inactive
				if (context.servers && context.servers[serverId]) {
					context.servers[serverId].active = false;
				}
				
				// Unregister this execution
				registry.unregisterExecution(serverId, executionId);
				
				// FIXED DETECTION LOGIC: 
				// For n8n, we can't reliable detect workflow end vs execution end
				// So we'll always use soft close to ensure connections stay open for response nodes
				// This is safe because proper cleanup will happen on n8n shutdown
				const forceSoftClose = true; // Always use soft close to keep connections
				console.error(`[DEBUG-TRIGGER] Using soft close: ${forceSoftClose}`);
				
				if (!forceSoftClose) {
					// This branch is now effectively disabled, but kept for reference
					await registry.closeServer(serverId, { executionId });
					console.error(`[DEBUG-TRIGGER] Fully closed server due to workflow deactivation/deletion`);
				} else {
					// Always use soft close to keep clients alive
					await registry.closeServer(serverId, { keepClientsAlive: true, executionId });
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