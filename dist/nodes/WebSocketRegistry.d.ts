import WebSocket from 'ws';
interface IServerConfig {
    path: string;
}
export declare class WebSocketRegistry {
    private static instance;
    private servers;
    private readonly registryPath;
    private readonly N8N_PORT;
    private constructor();
    static getInstance(): WebSocketRegistry;
    private loadRegistry;
    private saveRegistry;
    private findN8nServer;
    private createServer;
    getOrCreateServer(serverId: string, config: IServerConfig): Promise<WebSocket.Server>;
    getServer(serverId: string): WebSocket.Server | undefined;
    getClient(serverId: string, clientId: string): WebSocket | undefined;
    closeServer(serverId: string): Promise<void>;
    listServers(): void;
    private listClients;
}
export {};
