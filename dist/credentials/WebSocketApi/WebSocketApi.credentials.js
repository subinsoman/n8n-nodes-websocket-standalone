"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketApi = void 0;
class WebSocketApi {
    constructor() {
        this.name = 'webSocketApi';
        this.displayName = 'WebSocket API';
        this.documentationUrl = 'https://docs.n8n.io/credentials/webSocketApi';
        this.properties = [
            {
                displayName: 'No Authentication Required',
                name: 'noAuth',
                type: 'boolean',
                default: true,
            },
        ];
    }
}
exports.WebSocketApi = WebSocketApi;
//# sourceMappingURL=WebSocketApi.credentials.js.map