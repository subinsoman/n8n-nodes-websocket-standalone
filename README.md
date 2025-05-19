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