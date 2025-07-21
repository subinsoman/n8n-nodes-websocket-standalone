import {
  INodeType,
  INodeTypeDescription,
  ITriggerFunctions,
  ITriggerResponse,
} from "n8n-workflow"
import { WebSocketRegistry } from "../WebSocketRegistry"

// Create a global store for execution context
if (!(global as any).websocketExecutionContext) {
  ;(global as any).websocketExecutionContext = {
    servers: {},
    listeners: {},
    activeWorkflows: new Set(), // Track active workflows
    cleanupTimeouts: new Map(), // Track cleanup timeouts
    pendingSends: new Map<string, Promise<void>[]>(), // Typed as Map of arrays of promises
  }
}

export class WebSocketTrigger implements INodeType {
  authPropertyName = 'authentication';

  description: INodeTypeDescription = {
    displayName: "WebSocket Trigger",
    name: "webSocketTrigger",
    icon: "fa:plug",
    group: ["trigger"],
    version: 1,
    description: "Starts the workflow when a WebSocket message is received",
    defaults: {
      name: "WebSocket Trigger",
    },
    inputs: [],
    outputs: ["main"],
    credentials: [
      {
        name: 'httpBasicAuth',
        required: true,
        displayOptions: {
          show: {
            authentication: ['basicAuth'],
          },
        },
      },
      {
        name: 'httpHeaderAuth',
        required: true,
        displayOptions: {
          show: {
            authentication: ['headerAuth'],
          },
        },
      },
      {
        name: 'jwtAuth',
        required: true,
        displayOptions: {
          show: {
            authentication: ['jwtAuth'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Port",
        name: "port",
        type: "number",
        default: 5680,
        required: true,
        description: "The port to listen on",
      },
      {
        displayName: "Path",
        name: "path",
        type: "string",
        default: "/ws",
        required: true,
        description: "The WebSocket server path",
      },
      {
        displayName: "Connection ID",
        name: "connectionId",
        type: "string",
        default: "",
        required: false,
        description:
          "Optional custom connection ID. If not provided, the port will be used",
      },
      {
        displayName: "Authentication",
        name: "authentication",
        type: "options",
        options: [
          {
            name: "Basic Auth",
            value: "basicAuth",
          },
          {
            name: "Header Auth",
            value: "headerAuth",
          },
          {
            name: "JWT Auth",
            value: "jwtAuth",
          },
          {
            name: "None",
            value: "none",
          },
        ],
        default: "none",
        description: "The way to authenticate WebSocket connections",
      },
      {
        displayName: "Server Sharing",
        name: "serverSharing",
        type: "options",
        options: [
          {
            name: "Shared (Multiple workflows can use same server)",
            value: "shared",
          },
          {
            name: "Exclusive (Close server when workflow deactivates)",
            value: "exclusive",
          },
        ],
        default: "shared",
        description: "How to handle server lifecycle when workflow is deactivated",
      },
      {
        displayName: "Test Execution Behavior",
        name: "testExecutionBehavior",
        type: "options",
        options: [
          {
            name: "Auto-stop after first message",
            value: "auto_stop",
          },
          {
            name: "Keep listening for multiple messages",
            value: "keep_listening",
          },
        ],
        default: "auto_stop",
        description: "How to handle test executions (manual workflow runs)",
      },
      {
        displayName: "Test Execution Timeout",
        name: "testExecutionTimeout",
        type: "number",
        default: 30,
        required: false,
        description: "Timeout in seconds for test executions when 'Keep listening' is selected (0 = no timeout)",
        displayOptions: {
          show: {
            testExecutionBehavior: ['keep_listening'],
          },
        },
      },
      {
        displayName: "Info",
        name: "info",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            "@version": [1],
          },
        },
        options: [
          {
            name: "info",
            value:
              "The WebSocket server will be available at: ws://localhost:{port}{path}",
          },
        ],
      },
    ],
  }

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const port = this.getNodeParameter("port") as number
    const path = this.getNodeParameter("path") as string
    const customConnectionId = this.getNodeParameter("connectionId", "") as string
    const authentication = this.getNodeParameter("authentication") as string
    const serverSharing = this.getNodeParameter("serverSharing", "shared") as string
    const testExecutionBehavior = this.getNodeParameter("testExecutionBehavior", "auto_stop") as string
    const testExecutionTimeout = this.getNodeParameter("testExecutionTimeout", 30) as number

    // Get execution and node IDs for context tracking
    const executionId = this.getExecutionId()
    const nodeId = this.getNode().id
    const workflowId = this.getWorkflow().id

    // Handle undefined workflowId by generating a fallback
    const safeWorkflowId = workflowId || `unknown-${nodeId}-${Date.now()}`

    // Generate server ID with additional context info
    const connectionId = customConnectionId || `${port}`
    const serverId = `ws-${connectionId}`

    console.error(`[DEBUG-TRIGGER] Creating WebSocket server with ID: ${serverId}`)
    console.error(`[DEBUG-TRIGGER] Execution ID: ${executionId}, Node ID: ${nodeId}, Workflow ID: ${safeWorkflowId}`)
    console.error(`[DEBUG-TRIGGER] Server sharing mode: ${serverSharing}`)
    console.error(`[DEBUG-TRIGGER] Test execution behavior: ${testExecutionBehavior}`)

    // Use global context instead of workflow context
    const context = (global as any).websocketExecutionContext
    if (!context.servers) {
      context.servers = {}
    }
    if (!context.listeners) {
      context.listeners = {}
    }
    if (!context.activeWorkflows) {
      context.activeWorkflows = new Set()
    }
    if (!context.cleanupTimeouts) {
      context.cleanupTimeouts = new Map()
    }
    if (!context.pendingSends) {
      context.pendingSends = new Map<string, Promise<void>[]>()
    }

    const registry = WebSocketRegistry.getInstance()
    console.error(`[DEBUG-TRIGGER] Current WebSocket Servers (Before Creation) ===`)
    registry.listServers()

    // Store reference to 'this' for use in closures
    const triggerContext = this

    // Create a unique cleanup key for this execution
    const cleanupKey = `${serverId}-${executionId}`

    try {
      // Detect different trigger scenarios
      const isWorkflowEdit = executionId === undefined
      const isWorkflowDeactivation = this.getMode() === 'trigger' && !this.getActivationMode()
      const isManualExecution = this.getMode() === 'manual'

      console.error(`[DEBUG-TRIGGER] Trigger scenario analysis:`)
      console.error(`[DEBUG-TRIGGER] - Is workflow edit: ${isWorkflowEdit}`)
      console.error(`[DEBUG-TRIGGER] - Is workflow deactivation: ${isWorkflowDeactivation}`)
      console.error(`[DEBUG-TRIGGER] - Is manual execution: ${isManualExecution}`)
      console.error(`[DEBUG-TRIGGER] - Current mode: ${this.getMode()}`)

      // For exclusive mode, always close existing servers when workflow starts
      if (serverSharing === 'exclusive') {
        console.error(`[DEBUG-TRIGGER] Exclusive mode: Closing any existing server on ${serverId}`)
        await registry.closeServer(serverId, {
          keepClientsAlive: false,
          executionId,
          reason: 'exclusive_mode_restart'
        })
      } else {
        // For shared mode, only force close on workflow edits
        if (isWorkflowEdit) {
          console.error(`[DEBUG-TRIGGER] Shared mode: Force closing server due to workflow edit`)
          await registry.closeServer(serverId, {
            keepClientsAlive: false,
            executionId,
            reason: 'workflow_edit'
          })
        }
      }

      // Create or get server
      const serverConfig = {
        port,
        path,
        authentication: authentication !== 'none' ? {
          type: authentication,
          getCredentials: async (type: string) => {
            try {
              return await this.getCredentials(type);
            } catch (error) {
              console.error(`[DEBUG-TRIGGER] Failed to get credentials for ${type}:`, error);
              return undefined;
            }
          }
        } : undefined,
        serverSharing,
        workflowId: safeWorkflowId
      };

      const wss = await registry.getOrCreateServer(serverId, serverConfig)
      console.error(`[DEBUG-TRIGGER] WebSocket server created/retrieved successfully`)

      // Remove any old listeners for this server before adding new ones
      const oldListeners = context.listeners[serverId]
      if (oldListeners) {
        console.error(`[DEBUG-TRIGGER] Removing ${oldListeners.size} old listeners for server ${serverId}`)
        for (const listener of oldListeners) {
          wss.off("message", listener)
        }
        oldListeners.clear()
      }

      // Register this execution and workflow with the server
      registry.registerExecution(serverId, executionId)
      registry.registerWorkflow(serverId, safeWorkflowId)
      context.activeWorkflows.add(safeWorkflowId)

      // Store in context
      context.servers[serverId] = {
        serverId,
        port,
        path,
        nodeId,
        executionId,
        workflowId: safeWorkflowId,
        serverSharing,
        active: true,
        createdAt: new Date().toISOString(),
      }

      console.error(`[DEBUG-TRIGGER] Server added to execution context: ${JSON.stringify(context.servers[serverId])}`)

      // Track message count for test executions
      let messageCount = 0
      let testTimeout: NodeJS.Timeout | null = null
      let cleanupExecuted = false // Flag to prevent multiple cleanup executions

      // Centralized cleanup function
      const cleanupExecution = async (reason: string) => {
        if (cleanupExecuted) {
          console.error(`[DEBUG-TRIGGER] Cleanup already executed for ${cleanupKey}, skipping (reason: ${reason})`)
          return
        }
        cleanupExecuted = true

        console.error(`[DEBUG-TRIGGER] Execution cleanup triggered for ${serverId}`)
        console.error(`[DEBUG-TRIGGER] Cleanup reason: ${reason}`)
        
        // Clear all timeouts for this execution
        const timeoutInfo = context.cleanupTimeouts.get(cleanupKey)
        if (timeoutInfo) {
          if (timeoutInfo.executionTimeout) {
            clearTimeout(timeoutInfo.executionTimeout)
          }
          if (timeoutInfo.testTimeout) {
            clearTimeout(timeoutInfo.testTimeout)
          }
          context.cleanupTimeouts.delete(cleanupKey)
        }
        
        // Clear test timeout if it exists
        if (testTimeout) {
          clearTimeout(testTimeout)
          testTimeout = null
        }
        
        // Unregister this specific execution
        registry.unregisterExecution(serverId, executionId)
        
        // Check if this was a manual execution
        const isManualExecution = triggerContext.getMode() === 'manual'
        
        // For manual executions, behavior depends on the setting
        if (isManualExecution) {
          console.error(`[DEBUG-TRIGGER] Manual execution cleanup - behavior: ${testExecutionBehavior}`)
          
          if (testExecutionBehavior === 'auto_stop' || reason === 'test_execution_timeout') {
            console.error(`[DEBUG-TRIGGER] Manual execution - forcing server close`)
            await registry.closeServer(serverId, {
              keepClientsAlive: false,
              executionId,
              reason: 'manual_execution_finished'
            })
            
            // Clean up global context
            if (context.servers && context.servers[serverId]) {
              delete context.servers[serverId]
            }
            if (context.listeners && context.listeners[serverId]) {
              delete context.listeners[serverId]
            }
            context.activeWorkflows.delete(safeWorkflowId)
            console.error(`[DEBUG-TRIGGER] Manual execution cleanup completed for server ${serverId}`)
          } else {
            console.error(`[DEBUG-TRIGGER] Manual execution with keep_listening - leaving server running`)
          }
          return
        }
        
        // For regular executions, check if there are any remaining executions
        const hasOtherActiveExecutions = registry.hasActiveExecutions(serverId)
        if (!hasOtherActiveExecutions && serverSharing === 'exclusive') {
          console.error(`[DEBUG-TRIGGER] No active executions in exclusive mode - closing server`)
          await registry.closeServer(serverId, {
            keepClientsAlive: false,
            executionId,
            reason: 'no_active_executions'
          })
        }
      }

      const executeTrigger = async (data: any) => {
        try {
          messageCount++
          console.error(`[DEBUG-TRIGGER] Message ${messageCount} received. Server ID: ${serverId}, Client ID: ${data.clientId}`)
          
          // Include comprehensive context in the output
          const outputData = {
            ...data,
            serverId,
            path,
            port,
            nodeId,
            executionId,
            workflowId: safeWorkflowId,
            clientId: data.clientId,
            serverSharing,
            messageCount,
            contextInfo: context.servers[serverId],
            timestamp: new Date().toISOString(),
          }

          console.error(`[DEBUG-TRIGGER] Received message. Server ID: ${serverId}, Client ID: ${data.clientId}, Workflow ID: ${safeWorkflowId}`)
          
          // Emit the data to continue the workflow
          triggerContext.emit([triggerContext.helpers.returnJsonArray([outputData])])
          
          // Handle test execution behavior
          if (isManualExecution) {
            if (testExecutionBehavior === 'keep_listening') {
              console.error(`[DEBUG-TRIGGER] Test execution with keep_listening - continuing to listen for messages`)
              // Clear any existing timeout
              if (testTimeout) {
                clearTimeout(testTimeout)
              }
              
              // Set up new timeout if specified
              if (testExecutionTimeout > 0) {
                testTimeout = setTimeout(async () => {
                  console.error(`[DEBUG-TRIGGER] Test execution timeout reached after ${testExecutionTimeout} seconds`)
                  await cleanupExecution('test_execution_timeout')
                }, testExecutionTimeout * 1000)
              }
            } // No else block needed for 'auto_stop' – let n8n handle close
          }
        } catch (error) {
          console.error(`[DEBUG-TRIGGER] Error in trigger execution:`, error)
        }
      }

      // Track this listener in the global context
      if (!context.listeners[serverId]) {
        context.listeners[serverId] = new Set()
      }
      context.listeners[serverId].add(executeTrigger)

      wss.on("message", executeTrigger)
      console.error(`[DEBUG-TRIGGER] Added new listener for server ${serverId}`)

      // Verify the server is running
      const server = registry.getServer(serverId)
      if (!server) {
        throw new Error(`Failed to verify server ${serverId} is running`)
      }

      // Mark execution count for debugging
      if (!context.executionCounts) {
        context.executionCounts = {}
      }
      context.executionCounts[serverId] = (context.executionCounts[serverId] || 0) + 1
      const executionCount = context.executionCounts[serverId]
      console.error(`[DEBUG-TRIGGER] Execution count for server ${serverId}: ${executionCount}`)

      // Set up automatic execution cleanup only for non-manual executions or auto_stop manual executions
      let executionTimeout: NodeJS.Timeout | null = null
      if (!isManualExecution || testExecutionBehavior === 'auto_stop') {
        executionTimeout = setTimeout(async () => {
          console.error(`[DEBUG-TRIGGER] Execution timeout reached for ${serverId}`)
          await cleanupExecution('execution_timeout')
        }, 30000) // 30 seconds timeout
      }

      // Store timeout references for cleanup coordination
      context.cleanupTimeouts.set(cleanupKey, {
        executionTimeout,
        testTimeout: null // Will be set later if needed
      })

      // Enhanced close function with better lifecycle management
      const closeFunction = async () => {
        if (cleanupExecuted) {
          console.error(`[DEBUG-TRIGGER] Close function called but cleanup already executed for ${cleanupKey}`)
          return
        }

        console.error(`[DEBUG-TRIGGER] Starting closeFunction for server ${serverId}`)

        // Mark cleanup as executed to prevent race conditions
        cleanupExecuted = true

        // Clear all timeouts for this execution
        const timeoutInfo = context.cleanupTimeouts.get(cleanupKey)
        if (timeoutInfo) {
          if (timeoutInfo.executionTimeout) {
            clearTimeout(timeoutInfo.executionTimeout)
          }
          if (timeoutInfo.testTimeout) {
            clearTimeout(timeoutInfo.testTimeout)
          }
          context.cleanupTimeouts.delete(cleanupKey)
        }
        
        // Clear test timeout
        if (testTimeout) {
          clearTimeout(testTimeout)
        }

        // Remove the listener from the server
        if (context.listeners && context.listeners[serverId]) {
          context.listeners[serverId].delete(executeTrigger)
          console.error(`[DEBUG-TRIGGER] Removed listener for server ${serverId}`)
          if (context.listeners[serverId].size === 0) {
            delete context.listeners[serverId]
          }
        }

        // Update context to mark server as inactive
        if (context.servers && context.servers[serverId]) {
          context.servers[serverId].active = false
          context.servers[serverId].closedAt = new Date().toISOString()
        }

        // Unregister this execution and workflow
        registry.unregisterExecution(serverId, executionId)
        registry.unregisterWorkflow(serverId, safeWorkflowId)
        context.activeWorkflows.delete(safeWorkflowId)

        // Check if this is a manual execution
        const isManualExecution = triggerContext.getMode() === 'manual'
        
        // Determine close behavior based on execution type and settings
        let shouldForceClose = false
        let closeReason = 'workflow_deactivation'

        if (isManualExecution && testExecutionBehavior === 'keep_listening') {
          shouldForceClose = false
          closeReason = 'manual_execution_keep_listening'
          console.error(`[DEBUG-TRIGGER] Manual execution with keep_listening: Keeping server alive`)
        } else if (isManualExecution) {
          shouldForceClose = true
          closeReason = 'manual_execution_finished'
          console.error(`[DEBUG-TRIGGER] Manual execution with auto_stop: Force closing server`)
        } else if (serverSharing === 'exclusive') {
          // In exclusive mode, always close the server when workflow deactivates
          shouldForceClose = true
          closeReason = 'exclusive_mode_deactivation'
          console.error(`[DEBUG-TRIGGER] Exclusive mode: Force closing server`)
        } else {
          // In shared mode, check if other workflows are still using this server
          const hasOtherActiveWorkflows = registry.hasActiveWorkflows(serverId)
          shouldForceClose = !hasOtherActiveWorkflows
          closeReason = hasOtherActiveWorkflows ? 'shared_mode_soft_close' : 'shared_mode_no_active_workflows'
          console.error(`[DEBUG-TRIGGER] Shared mode: Other active workflows = ${hasOtherActiveWorkflows}`)
        }

        console.error(`[DEBUG-TRIGGER] Close decision: Force close = ${shouldForceClose}, Reason = ${closeReason}`)

        // New logic: In test mode (manual execution), wait for workflow to finish by awaiting pending sends
        if (isManualExecution && shouldForceClose) {
          console.error(`[DEBUG-TRIGGER] Waiting for pending sends to complete before closing in manual mode`)
          const pending: Promise<void>[] = context.pendingSends.get(serverId) || []
          //await Promise.allSettled(pending)
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.error(`[DEBUG-TRIGGER] All pending sends completed (${pending.length} operations)`)
        }

        await registry.closeServer(serverId, {
          keepClientsAlive: !shouldForceClose,
          executionId,
          reason: closeReason
        })

        if (shouldForceClose) {
          console.error(`[DEBUG-TRIGGER] Server completely closed due to: ${closeReason}`)
          // Clear pending sends after close
          context.pendingSends.delete(serverId)
        } else {
          console.error(`[DEBUG-TRIGGER] Server soft-closed, connections maintained for other workflows`)
        }

        // Clean up global context if server was fully closed
        if (shouldForceClose) {
          if (context.servers && context.servers[serverId]) {
            delete context.servers[serverId]
          }
          if (context.listeners && context.listeners[serverId]) {
            delete context.listeners[serverId]
          }
          console.error(`[DEBUG-TRIGGER] Cleaned up global context for server ${serverId}`)
        }
      }

      return {
        closeFunction,
      }
    } catch (error) {
      console.error(`[DEBUG-TRIGGER] Error in WebSocket trigger:`, error)
      // Clean up on error
      context.activeWorkflows.delete(safeWorkflowId)
      context.cleanupTimeouts.delete(cleanupKey)
      context.pendingSends.delete(serverId)
      throw error
    }
  }
}