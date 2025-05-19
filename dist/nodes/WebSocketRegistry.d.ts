import * as WebSocket from 'ws';
import * as http from 'http';
export interface WebSocketClient extends WebSocket {
    id: string;
    isAlive: boolean;
}
interface ServerConfig {
    port: number;
    path: string;
}
interface ServerInstance {
    server: http.Server;
    wss: WebSocket.Server;
    clients: Map<string, WebSocketClient>;
    config: ServerConfig;
    heartbeat?: NodeJS.Timeout;
}
export declare class WebSocketRegistry {
    private static instance;
    private servers;
    private initializationPromise;
    private constructor();
    private cleanup;
    static getInstance(): WebSocketRegistry;
    private initialize;
    listServers(): void;
    getOrCreateServer(serverId: string, config: ServerConfig): Promise<WebSocket.Server>;
    closeServer(serverId: string): Promise<void>;
    getServer(serverId: string): ServerInstance | undefined;
    removeServer(serverId: string): void;
}
export {};
