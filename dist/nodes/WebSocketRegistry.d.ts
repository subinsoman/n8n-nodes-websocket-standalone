import WebSocket from 'ws';
interface IServerConfig {
    port: number;
    path: string;
}
export declare class WebSocketRegistry {
    private static instance;
    private servers;
    private readonly registryPath;
    private constructor();
    static getInstance(): WebSocketRegistry;
    private loadRegistry;
    private saveRegistry;
    private createServer;
    getOrCreateServer(serverId: string, config: IServerConfig): Promise<WebSocket.Server>;
    getServer(serverId: string): WebSocket.Server | undefined;
    getClient(serverId: string, clientId: string): WebSocket | undefined;
    closeServer(serverId: string, options?: {
        keepClientsAlive?: boolean;
        executionId?: string;
    }): Promise<void>;
    listServers(): void;
    private listClients;
    broadcastToServer(serverId: string, message: string, callback?: (client: WebSocket) => void): void;
    registerExecution(serverId: string, executionId: string): void;
    unregisterExecution(serverId: string, executionId: string): void;
}
export {};
