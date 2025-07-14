import fs from "fs"
import os from "os"
import path from "path"
import WebSocket from "ws"

interface IServerInfo {
  port: number
  path: string
  clientCount: number
  activeExecutions?: Set<string>
  activeWorkflows?: Set<string>
  serverSharing?: string
  createdAt?: string
}

interface IServerConfig {
  port: number
  path: string
  authentication?: {
    type: string
    getCredentials: (type: string) => Promise<any>
  }
  serverSharing?: string
  workflowId?: string
}

interface IServerEntry {
  wss: WebSocket.Server
  clients: Map<string, WebSocket>
  activeExecutions: Set<string>
  activeWorkflows: Set<string>
  serverSharing: string
  createdAt: string
  lastActivity: string
}

interface ICloseOptions {
  keepClientsAlive?: boolean
  executionId?: string
  reason?: string
}

export class WebSocketRegistry {
  private static instance: WebSocketRegistry
  private servers: Map<string, IServerEntry>
  private readonly registryPath: string
  private cleanupInterval?: NodeJS.Timeout

  private constructor() {
    this.servers = new Map()
    this.registryPath = path.join(os.tmpdir(), "n8n-websocket-registry.json")
    this.loadRegistry()
    this.startCleanupInterval()
  }

  public static getInstance(): WebSocketRegistry {
    if (!WebSocketRegistry.instance) {
      WebSocketRegistry.instance = new WebSocketRegistry()
    }
    return WebSocketRegistry.instance
  }

  private startCleanupInterval() {
    // Clean up inactive servers every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveServers()
    }, 5 * 60 * 1000)
  }

  private cleanupInactiveServers() {
    const now = Date.now()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    console.error("[DEBUG-REGISTRY] Running cleanup for inactive servers")
    
    this.servers.forEach((server, serverId) => {
      const lastActivity = new Date(server.lastActivity).getTime()
      const timeSinceActivity = now - lastActivity
      
      // Only clean up servers with no active executions, workflows, or clients
      if (server.activeExecutions.size === 0 && 
          server.activeWorkflows.size === 0 && 
          server.clients.size === 0 && 
          timeSinceActivity > inactiveThreshold) {
        
        console.error(`[DEBUG-REGISTRY] Cleaning up inactive server ${serverId} (inactive for ${Math.round(timeSinceActivity / 1000 / 60)} minutes)`)
        this.closeServer(serverId, { 
          keepClientsAlive: false, 
          reason: 'automatic_cleanup' 
        })
      }
    })
  }

  private loadRegistry() {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = JSON.parse(fs.readFileSync(this.registryPath, "utf8")) as Record<string, IServerInfo>
        // Note: We don't recreate servers from registry on load anymore
        // This prevents ghost servers from previous n8n sessions
        console.error("[DEBUG-REGISTRY] Registry loaded, but not recreating servers from previous session")
      }
    } catch (error) {
      console.error("[DEBUG-REGISTRY] Error loading registry:", error)
    }
  }

  private saveRegistry() {
    try {
      const data: { [key: string]: IServerInfo } = {}
      this.servers.forEach((server, serverId) => {
        const address = server.wss.address()
        if (address && typeof address === "object") {
          data[serverId] = {
            port: address.port,
            path: server.wss.options.path as string,
            clientCount: server.clients.size,
            activeExecutions: server.activeExecutions,
            activeWorkflows: server.activeWorkflows,
            serverSharing: server.serverSharing,
            createdAt: server.createdAt,
          }
        }
      })
      fs.writeFileSync(this.registryPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("[DEBUG-REGISTRY] Error saving registry:", error)
    }
  }

  private createServer(serverId: string, config: IServerConfig) {
    console.error(`[DEBUG-REGISTRY] Creating WebSocket server on port ${config.port} with path ${config.path}`)
    console.error(`[DEBUG-REGISTRY] Server sharing mode: ${config.serverSharing || 'shared'}`)

    const serverOptions: WebSocket.ServerOptions = {
      port: config.port,
      path: config.path,
    }

    // Add authentication if configured
    if (config.authentication && config.authentication.type !== "none") {
      serverOptions.verifyClient = async (info: any) => {
        try {
          const { validateWebSocketAuthentication } = await import("./WebSocketTrigger/utils")
          await validateWebSocketAuthentication(
            info.req,
            config.authentication!.type,
            config.authentication!.getCredentials
          )
          return true
        } catch (error: any) {
          console.error(`[DEBUG-REGISTRY] Authentication failed for ${serverId}:`, error.message)
          return false
        }
      }
    }

    const wss = new WebSocket.Server(serverOptions)
    const clients = new Map<string, WebSocket>()
    const activeExecutions = new Set<string>()
    const activeWorkflows = new Set<string>()
    const serverSharing = config.serverSharing || 'shared'
    const createdAt = new Date().toISOString()

    // Set up ping interval to keep connections alive
    const pingInterval = setInterval(() => {
      if (clients.size === 0) {
        return
      }

      console.error(`[DEBUG-REGISTRY] Sending ping to ${clients.size} clients on server ${serverId}`)
      clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.ping()
            console.error(`[DEBUG-REGISTRY] Ping sent to client ${clientId}`)
          } catch (error) {
            console.error(`[DEBUG-REGISTRY] Error sending ping to client ${clientId}:`, error)
          }
        } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
          console.error(`[DEBUG-REGISTRY] Removing dead client ${clientId} from server ${serverId}`)
          clients.delete(clientId)
          this.updateLastActivity(serverId)
          this.saveRegistry()
        }
      })
    }, 30000) // Send a ping every 30 seconds

    // Handle server events
    wss.on("listening", () => {
      console.error(`[DEBUG-REGISTRY] WebSocket server ${serverId} is now listening on port ${config.port}`)
    })

    wss.on("error", (error) => {
      console.error(`[DEBUG-REGISTRY] WebSocket server ${serverId} error:`, error)
      
      // If port is already in use, try to clean up and recreate
      if (error.message.includes('EADDRINUSE')) {
        console.error(`[DEBUG-REGISTRY] Port ${config.port} is already in use, attempting cleanup`)
        // Don't immediately retry, let the caller handle it
      }
    })

    wss.on("connection", (ws: WebSocket, request) => {
      const clientId = Math.random().toString(36).substring(2, 8)
      clients.set(clientId, ws)

      console.error(`[DEBUG-REGISTRY] New client connected. Server ID: ${serverId}, Client ID: ${clientId}`)
      console.error(`[DEBUG-REGISTRY] Client IP: ${request.socket.remoteAddress}`)
      console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`)
      this.updateLastActivity(serverId)
      this.listClients(serverId)

      // Set up client-side ping/pong handling
      ws.on("ping", () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.pong()
        }
      })

      ws.on("pong", () => {
        console.error(`[DEBUG-REGISTRY] Received pong from client ${clientId}`)
        this.updateLastActivity(serverId)
      })

      ws.on("message", (message: WebSocket.Data) => {
        console.error(`[DEBUG-REGISTRY] Received message from client ${clientId} on server ${serverId}`)
        this.updateLastActivity(serverId)
        try {
          const data = JSON.parse(message.toString())
          wss.emit("message", { ...data, clientId })
        } catch (error) {
          wss.emit("message", { message: message.toString(), clientId })
        }
      })

      ws.on("close", (code, reason) => {
        clients.delete(clientId)
        console.error(`[DEBUG-REGISTRY] Client ${clientId} disconnected from server ${serverId}`)
        console.error(`[DEBUG-REGISTRY] Close code: ${code}, reason: ${reason}`)
        console.error(`[DEBUG-REGISTRY] Active Clients: ${clients.size}`)
        this.updateLastActivity(serverId)
        this.listClients(serverId)
        this.saveRegistry()
      })

      ws.on("error", error => {
        console.error(`[DEBUG-REGISTRY] WebSocket error for client ${clientId}:`, error)
        this.updateLastActivity(serverId)
      })
    })

    // Add a handler for server close to clean up the ping interval
    const originalClose = wss.close.bind(wss)
    wss.close = function (callback?: (err?: Error) => void) {
      clearInterval(pingInterval)
      console.error(`[DEBUG-REGISTRY] Stopping ping interval for server ${serverId}`)
      return originalClose(callback)
    }

    const serverEntry: IServerEntry = {
      wss,
      clients,
      activeExecutions,
      activeWorkflows,
      serverSharing,
      createdAt,
      lastActivity: createdAt
    }

    this.servers.set(serverId, serverEntry)
    this.saveRegistry()
    
    console.error(`[DEBUG-REGISTRY] Server ${serverId} created successfully`)
    return wss
  }

  private updateLastActivity(serverId: string) {
    const server = this.servers.get(serverId)
    if (server) {
      server.lastActivity = new Date().toISOString()
    }
  }

  public async getOrCreateServer(serverId: string, config: IServerConfig): Promise<WebSocket.Server> {
    this.loadRegistry() // Reload registry to get latest state

    const server = this.servers.get(serverId)
    if (server) {
      // Check if config has changed and force recreation if so
      const address = server.wss.address()
      if (address && typeof address === "object") {
        const currentPort = address.port
        const currentPath = server.wss.options.path as string
        const currentSharing = server.serverSharing

        if (currentPort !== config.port || 
            currentPath !== config.path || 
            currentSharing !== (config.serverSharing || 'shared')) {
          console.error(`[DEBUG-REGISTRY] Server config changed for ${serverId}`)
          console.error(`[DEBUG-REGISTRY] Port: ${currentPort} -> ${config.port}`)
          console.error(`[DEBUG-REGISTRY] Path: ${currentPath} -> ${config.path}`)
          console.error(`[DEBUG-REGISTRY] Sharing: ${currentSharing} -> ${config.serverSharing || 'shared'}`)
          
          // Close the old server and create a new one
          await this.closeServer(serverId, { 
            keepClientsAlive: false, 
            reason: 'config_change' 
          })
          return this.createServer(serverId, config)
        }
      }

      this.updateLastActivity(serverId)
      return server.wss
    }

    return this.createServer(serverId, config)
  }

  public getServer(serverId: string): WebSocket.Server | undefined {
    this.loadRegistry() // Reload registry to get latest state
    const server = this.servers.get(serverId)
    if (server) {
      this.updateLastActivity(serverId)
    }
    return server?.wss
  }

  public getClient(serverId: string, clientId: string): WebSocket | undefined {
    const server = this.servers.get(serverId)
    if (server) {
      this.updateLastActivity(serverId)
    }
    return server?.clients.get(clientId)
  }

  public hasActiveWorkflows(serverId: string): boolean {
    const server = this.servers.get(serverId)
    return server ? server.activeWorkflows.size > 0 : false
  }

  public hasActiveExecutions(serverId: string): boolean {
    const server = this.servers.get(serverId)
    return server ? server.activeExecutions.size > 0 : false
  }

  public async closeServer(serverId: string, options: ICloseOptions = {}): Promise<void> {
    const keepClientsAlive = options.keepClientsAlive !== false // Default to true unless explicitly set to false
    const executionId = options.executionId
    const reason = options.reason || 'manual_close'

    console.error(`[DEBUG-REGISTRY] Attempting to close server with ID: ${serverId}`)
    console.error(`[DEBUG-REGISTRY] Keep clients alive: ${keepClientsAlive}`)
    console.error(`[DEBUG-REGISTRY] Execution ID: ${executionId || "none"}`)
    console.error(`[DEBUG-REGISTRY] Reason: ${reason}`)

    const server = this.servers.get(serverId)
    if (!server) {
      console.error(`[DEBUG-REGISTRY] Server ${serverId} not found`)
      return
    }

    // Log current server state
    console.error(`[DEBUG-REGISTRY] Server ${serverId} current state:`)
    console.error(`[DEBUG-REGISTRY] - Active executions: ${server.activeExecutions.size}`)
    console.error(`[DEBUG-REGISTRY] - Active workflows: ${server.activeWorkflows.size}`)
    console.error(`[DEBUG-REGISTRY] - Connected clients: ${server.clients.size}`)
    console.error(`[DEBUG-REGISTRY] - Server sharing: ${server.serverSharing}`)

    // Determine if we should actually close the server
    const hasActiveExecutions = server.activeExecutions.size > 0
    const hasActiveWorkflows = server.activeWorkflows.size > 0
    const hasClients = server.clients.size > 0

    // In exclusive mode, we always close completely
    // In shared mode, we only close if no other workflows are active
    const shouldCompletelyClose = server.serverSharing === 'exclusive' || 
                                 (!hasActiveExecutions && !hasActiveWorkflows) ||
                                 !keepClientsAlive

    console.error(`[DEBUG-REGISTRY] Should completely close: ${shouldCompletelyClose}`)

    if (shouldCompletelyClose) {
      // Close all client connections
      console.error(`[DEBUG-REGISTRY] Closing all ${server.clients.size} client connections`)
      server.clients.forEach((client, clientId) => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.close(1000, `Server shutting down: ${reason}`)
          }
        } catch (error) {
          console.error(`[DEBUG-REGISTRY] Error closing client ${clientId}:`, error)
        }
      })

      // Close the server
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.error(`[DEBUG-REGISTRY] Server close timeout for ${serverId}`)
          resolve()
        }, 5000)

        server.wss.close((error) => {
          clearTimeout(timeout)
          if (error) {
            console.error(`[DEBUG-REGISTRY] Error closing server ${serverId}:`, error)
          } else {
            console.error(`[DEBUG-REGISTRY] Server ${serverId} closed successfully`)
          }
          resolve()
        })
      })

      // Remove from registry
      this.servers.delete(serverId)
      console.error(`[DEBUG-REGISTRY] Server ${serverId} removed from registry`)
    } else {
      // Soft close - just mark as inactive but keep connections
      console.error(`[DEBUG-REGISTRY] Soft close for server ${serverId} - keeping connections alive`)
      console.error(`[DEBUG-REGISTRY] Active workflows: ${Array.from(server.activeWorkflows).join(', ')}`)
    }

    this.saveRegistry()
  }

  public registerExecution(serverId: string, executionId: string): void {
    const server = this.servers.get(serverId)
    if (server && executionId) {
      server.activeExecutions.add(executionId)
      this.updateLastActivity(serverId)
      console.error(`[DEBUG-REGISTRY] Registered execution ${executionId} for server ${serverId}`)
      console.error(`[DEBUG-REGISTRY] Active executions: ${server.activeExecutions.size}`)
    }
  }

  public unregisterExecution(serverId: string, executionId: string): void {
    const server = this.servers.get(serverId)
    if (server && executionId) {
      server.activeExecutions.delete(executionId)
      this.updateLastActivity(serverId)
      console.error(`[DEBUG-REGISTRY] Unregistered execution ${executionId} from server ${serverId}`)
      console.error(`[DEBUG-REGISTRY] Remaining executions: ${server.activeExecutions.size}`)
    }
  }

  public registerWorkflow(serverId: string, workflowId: string): void {
    const server = this.servers.get(serverId)
    if (server && workflowId) {
      server.activeWorkflows.add(workflowId)
      this.updateLastActivity(serverId)
      console.error(`[DEBUG-REGISTRY] Registered workflow ${workflowId} for server ${serverId}`)
      console.error(`[DEBUG-REGISTRY] Active workflows: ${server.activeWorkflows.size}`)
    }
  }

  public unregisterWorkflow(serverId: string, workflowId: string): void {
    const server = this.servers.get(serverId)
    if (server && workflowId) {
      server.activeWorkflows.delete(workflowId)
      this.updateLastActivity(serverId)
      console.error(`[DEBUG-REGISTRY] Unregistered workflow ${workflowId} from server ${serverId}`)
      console.error(`[DEBUG-REGISTRY] Remaining workflows: ${server.activeWorkflows.size}`)
      
      // If this was the last workflow and server is in exclusive mode, close it
      if (server.activeWorkflows.size === 0 && server.serverSharing === 'exclusive') {
        console.error(`[DEBUG-REGISTRY] Last workflow removed from exclusive server ${serverId}, scheduling close`)
        // Schedule close after a short delay to allow cleanup
        setTimeout(() => {
          this.closeServer(serverId, { 
            keepClientsAlive: false, 
            reason: 'last_workflow_removed' 
          })
        }, 1000)
      }
    }
  }

  public listServers(): void {
    this.loadRegistry() // Reload registry to get latest state

    console.error("=== [DEBUG-REGISTRY] Available WebSocket Servers ===")
    if (this.servers.size === 0) {
      console.error("[DEBUG-REGISTRY] No active servers")
    } else {
      this.servers.forEach((server, serverId) => {
        const address = server.wss.address()
        if (address && typeof address === "object") {
          console.error(`[DEBUG-REGISTRY] Server ID: ${serverId}`)
          console.error(`[DEBUG-REGISTRY] Port: ${address.port}`)
          console.error(`[DEBUG-REGISTRY] Path: ${server.wss.options.path}`)
          console.error(`[DEBUG-REGISTRY] Server Sharing: ${server.serverSharing}`)
          console.error(`[DEBUG-REGISTRY] Active Clients: ${server.clients.size}`)
          console.error(`[DEBUG-REGISTRY] Active Executions: ${server.activeExecutions.size}`)
          console.error(`[DEBUG-REGISTRY] Active Workflows: ${server.activeWorkflows.size}`)
          console.error(`[DEBUG-REGISTRY] Created: ${server.createdAt}`)
          console.error(`[DEBUG-REGISTRY] Last Activity: ${server.lastActivity}`)
          
          if (server.activeWorkflows.size > 0) {
            console.error(`[DEBUG-REGISTRY] Workflows: ${Array.from(server.activeWorkflows).join(', ')}`)
          }
          
          this.listClients(serverId)
          console.error(`[DEBUG-REGISTRY] ---`)
        }
      })
    }
    console.error("=== [DEBUG-REGISTRY] End of Server List ===")
  }

  private listClients(serverId: string): void {
    const server = this.servers.get(serverId)
    if (server && server.clients.size > 0) {
      console.error(`[DEBUG-REGISTRY] Clients for server ${serverId}:`)
      server.clients.forEach((client, clientId) => {
        const state = client.readyState === WebSocket.OPEN ? 'OPEN' : 
                     client.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                     client.readyState === WebSocket.CLOSING ? 'CLOSING' : 'CLOSED'
        console.error(`[DEBUG-REGISTRY]   - Client ID: ${clientId} (${state})`)
      })
    }
  }

  public broadcastToServer(
    serverId: string,
    message: string,
    callback?: (client: WebSocket) => void
  ): void {
    const server = this.servers.get(serverId)
    if (!server) {
      console.error(`[DEBUG-REGISTRY] Server with ID ${serverId} not found for broadcast`)
      return
    }

    console.error(`[DEBUG-REGISTRY] Broadcasting message to server ${serverId} with ${server.clients.size} clients`)
    let sentCount = 0
    let errorCount = 0

    server.clients.forEach((client, clientId) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
          if (callback) {
            callback(client)
          }
          sentCount++
          console.error(`[DEBUG-REGISTRY] Message sent to client ${clientId}`)
        } else {
          console.error(`[DEBUG-REGISTRY] Skipping client ${clientId} - not open (state: ${client.readyState})`)
        }
      } catch (error) {
        errorCount++
        console.error(`[DEBUG-REGISTRY] Error sending message to client ${clientId}:`, error)
      }
    })

    console.error(`[DEBUG-REGISTRY] Broadcast complete. Sent: ${sentCount}, Errors: ${errorCount}`)
    this.updateLastActivity(serverId)
  }

  public broadcastToClient(serverId: string, clientId: string, message: string): boolean {
    const server = this.servers.get(serverId)
    if (!server) {
      console.error(`[DEBUG-REGISTRY] Server with ID ${serverId} not found for client broadcast`)
      return false
    }

    const client = server.clients.get(clientId)
    if (!client) {
      console.error(`[DEBUG-REGISTRY] Client ${clientId} not found in server ${serverId}`)
      return false
    }

    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
        console.error(`[DEBUG-REGISTRY] Message sent to client ${clientId} in server ${serverId}`)
        this.updateLastActivity(serverId)
        return true
      } else {
        console.error(`[DEBUG-REGISTRY] Client ${clientId} is not open (state: ${client.readyState})`)
        return false
      }
    } catch (error) {
      console.error(`[DEBUG-REGISTRY] Error sending message to client ${clientId}:`, error)
      return false
    }
  }

  public getServerStats(serverId: string): {
    exists: boolean
    clients: number
    executions: number
    workflows: number
    sharing: string
    uptime: number
  } | null {
    const server = this.servers.get(serverId)
    if (!server) {
      return null
    }

    const createdTime = new Date(server.createdAt).getTime()
    const uptime = Date.now() - createdTime

    return {
      exists: true,
      clients: server.clients.size,
      executions: server.activeExecutions.size,
      workflows: server.activeWorkflows.size,
      sharing: server.serverSharing,
      uptime: uptime
    }
  }

  public getAllServersStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    this.servers.forEach((server, serverId) => {
      const serverStats = this.getServerStats(serverId)
      if (serverStats) {
        stats[serverId] = serverStats
      }
    })

    return stats
  }

  // Cleanup method to be called when n8n shuts down
  public async cleanup(): Promise<void> {
    console.error("[DEBUG-REGISTRY] Starting registry cleanup...")
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    const closePromises: Promise<void>[] = []
    
    this.servers.forEach((server, serverId) => {
      console.error(`[DEBUG-REGISTRY] Closing server ${serverId} during cleanup`)
      closePromises.push(
        this.closeServer(serverId, { 
          keepClientsAlive: false, 
          reason: 'n8n_shutdown' 
        })
      )
    })

    await Promise.all(closePromises)
    
    // Clear the registry file
    try {
      if (fs.existsSync(this.registryPath)) {
        fs.unlinkSync(this.registryPath)
      }
    } catch (error) {
      console.error("[DEBUG-REGISTRY] Error clearing registry file:", error)
    }

    console.error("[DEBUG-REGISTRY] Registry cleanup complete")
  }
}