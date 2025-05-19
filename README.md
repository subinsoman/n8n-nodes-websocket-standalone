# n8n-nodes-websocket

This is a node package for [n8n](https://n8n.io) that adds WebSocket functionality to your workflows. It provides WebSocket Trigger and Response nodes that allow you to create WebSocket servers and handle real-time communication in your n8n workflows.

## Features

- 🔌 WebSocket Trigger node to start workflows on WebSocket messages
- 📤 WebSocket Response node to send messages back to clients
- 🔒 Automatic integration with n8n's HTTP server
- 🆔 Workflow-based WebSocket paths for easy identification
- ♾️ Persistent connections with automatic reconnection
- 🔄 Fallback to standalone server if n8n server is not available

## Installation

### In n8n:
1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-websocket` in **Enter npm package name**
4. Click **Install**

### Manual Installation:
```bash
npm install n8n-nodes-websocket
```

## Usage

### WebSocket Trigger Node
1. Add a "WebSocket Trigger" node to your workflow
2. The node will automatically create a WebSocket server at `ws://localhost:5678/workflow/{workflowId}`
3. Connect your WebSocket clients to this URL
4. When a message is received, the workflow will be triggered with the message data

### WebSocket Response Node
1. Add a "WebSocket Response" node after your processing nodes
2. Configure the response data you want to send back
3. The node will automatically send the response to the correct client

### Example Client Code
```javascript
// Connect to a specific workflow's WebSocket server
const ws = new WebSocket('ws://localhost:5678/workflow/123'); // Replace 123 with your workflow ID

// Send a message
ws.send(JSON.stringify({ 
    message: 'Hello from client!' 
}));

// Receive messages
ws.onmessage = (event) => {
    console.log('Received:', event.data);
};
```

## Development

1. Clone the repository
```bash
git clone https://github.com/yourusername/n8n-nodes-websocket.git
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
npm link n8n-nodes-websocket
```

## License

[MIT](LICENSE.md)

## Support

For issues and feature requests, please create an issue on GitHub. 