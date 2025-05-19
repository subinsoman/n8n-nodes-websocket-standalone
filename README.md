# n8n-nodes-websocket-standalone

This is a node package for [n8n](https://n8n.io) that adds standalone WebSocket server functionality to your workflows. It provides WebSocket Trigger and Response nodes that allow you to create independent WebSocket servers and handle real-time communication in your n8n workflows.

## Features

- 🔌 WebSocket Trigger node to start workflows on WebSocket messages
- 📤 WebSocket Response node to send messages back to clients
- 🌐 Standalone WebSocket server implementation (no dependency on n8n's HTTP server)
- 🔢 Custom port configuration for each WebSocket server
- 🛣️ Custom path configuration for WebSocket endpoints
- 🔄 Robust connection handling with automatic ping/pong keep-alive
- 🔌 Connection persistence between trigger and response nodes
- 🧪 Enhanced stability for testing and production workflows

## Installation

### In n8n:
1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-websocket-standalone` in **Enter npm package name**
4. Click **Install**

### Manual Installation:
```bash
npm install n8n-nodes-websocket-standalone
```

## Usage

### WebSocket Trigger Node
1. Add a "WebSocket Trigger" node to your workflow
2. Configure the port (default: 5680) and path (default: /ws)
3. Optionally set a custom connection ID
4. The node will create a WebSocket server at `ws://localhost:{port}{path}`
5. When a message is received, the workflow will be triggered with the message data

### WebSocket Response Node
1. Add a "WebSocket Response" node after your processing nodes
2. Configure how to obtain the server ID and client ID:
   - From input (using the data passed from the trigger node)
   - Custom (manually specify IDs)
   - Use context server (automatically find active server)
3. Set your response data (JSON or plain text)
4. The node will send the response to the specified client(s)

## Detailed Configuration

### WebSocket Trigger Node Configuration

The WebSocket Trigger node has the following configuration options:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Port | Number | 5680 | The port on which the WebSocket server will listen |
| Path | String | /ws | The URL path for the WebSocket endpoint |
| Connection ID | String | _empty_ | Optional custom identifier for the server. If not provided, the port will be used |

When a WebSocket message is received, the node will trigger the workflow and provide the following output data:

```json
{
  "message": "Message content from client",
  "serverId": "ws-5680",
  "path": "/ws",
  "port": 5680,
  "clientId": "abc123",
  "nodeId": "123456",
  "executionId": "7890",
  "contextInfo": {
    "active": true
  }
}
```

### WebSocket Response Node Configuration

The WebSocket Response node has the following configuration options:

| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| Connection ID Method | Dropdown | From Input, Custom, Use Context | From Input | How to determine which server to send the response to |
| Server ID Property | String | - | serverId | The property in the input data containing the server ID (when using "From Input") |
| Custom Server ID | String | - | _empty_ | The server ID to use (when using "Custom") |
| Client ID Method | Dropdown | From Input, Custom, Broadcast | From Input | How to determine which client to send the response to |
| Client ID Property | String | - | clientId | The property in the input data containing the client ID (when using "From Input") |
| Custom Client ID | String | - | _empty_ | The client ID to use (when using "Custom") |
| JSON Response | Boolean | - | true | Whether to format the response as JSON |
| Response Data | String | - | `={{ JSON.stringify($json) }}` | The response data to send (when JSON Response is false) |
| Response JSON | JSON | - | `={{ $json }}` | The JSON data to send (when JSON Response is true) |

### Example Workflow Setup

Here's a complete example of how to set up a workflow with trigger and response:

1. **Start with a WebSocket Trigger Node**
   - Set Port: `5680`
   - Set Path: `/ws`
   - Leave Connection ID empty (will use port as identifier)

2. **Add processing nodes as needed**
   - You can manipulate the incoming data as required
   - Make sure to preserve the `serverId` and `clientId` fields if you need to respond

3. **End with a WebSocket Response Node**
   - Connection ID Method: `From Input`
   - Server ID Property: `serverId`
   - Client ID Method: `From Input`
   - Client ID Property: `clientId`
   - Enable JSON Response
   - Response JSON: `={{ {"result": "success", "message": "Processed your request", "data": $json.message} }}`

This setup will ensure that responses are sent back to the same client that triggered the workflow.

### Example Client Code (Browser)
```javascript
// Connect to your configured WebSocket server
const ws = new WebSocket('ws://localhost:5680/ws');

// Send a message
ws.send(JSON.stringify({ 
    message: 'Hello from client!' 
}));

// Receive messages
ws.onmessage = (event) => {
    console.log('Received:', event.data);
};
```

### Example Client Code (Node.js)
```javascript
const WebSocket = require('ws');

// Connect to your configured WebSocket server
const ws = new WebSocket('ws://localhost:5680/ws');

// Send a message when connection is established
ws.on('open', function open() {
  ws.send(JSON.stringify({ 
    message: 'Hello from Node.js client!' 
  }));
});

// Receive messages
ws.on('message', function message(data) {
  console.log('Received:', data);
});
```

## Troubleshooting

### Connection Issues

If you're having trouble with WebSocket connections:

1. **Check if the server is running**
   - Look for log messages like `[DEBUG-TRIGGER] WebSocket server created/retrieved successfully`
   - Verify the port is not already in use by another service

2. **Connection is closing too quickly**
   - Check that you're using version 1.1.4 or later which implements the connection persistence
   - Look for log messages like `[DEBUG-REGISTRY] Server soft-closed, connections maintained for ws-5680`

3. **Response not reaching clients**
   - Verify the client ID and server ID are correctly passed to the Response node
   - Check that the client is still connected when the response is sent
   - Look for log messages like `[DEBUG-RESPONSE] Message sent to client`

### Common Errors

| Error | Possible Cause | Solution |
|-------|----------------|----------|
| `WebSocket server with ID X not found` | Server was closed or never created | Check server configuration and workflow order |
| `Client with ID X not found` | Client disconnected before response was sent | Implement error handling or client reconnect logic |
| `Failed to send message after retries` | Network issues or client disconnected | Check network connectivity and client state |

## Advantages Over Other WebSocket Nodes

- **Standalone Operation**: Works independently of n8n's HTTP server
- **Customizable Endpoints**: Configure port and path for each WebSocket server
- **Connection Stability**: Maintains connections between trigger and response nodes
- **Keep-Alive Mechanism**: Automatic ping/pong to prevent timeouts
- **Execution Tracking**: Prevents connections from closing during workflow testing
- **Retry Logic**: Reliable message delivery with automatic retries

## Development

1. Clone the repository
```bash
git clone https://github.com/subinsoman/n8n-nodes-websocket-standalone.git
```

2. Install dependencies
```bash
npm install
```

3. Build the package
```bash
npm run build
```

4. Link to your n8n installation
```bash
npm link
cd /path/to/n8n
npm link n8n-nodes-websocket-standalone
```

## License

[MIT](LICENSE.md)

## Support

For issues and feature requests, please create an issue on GitHub. 