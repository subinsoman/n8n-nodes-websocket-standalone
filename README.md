# n8n-nodes-websocket

This package provides WebSocket nodes for n8n workflow automation platform. It includes a WebSocket Trigger node for receiving messages and a WebSocket Response node for sending responses.

## Features

- WebSocket Trigger Node: Creates a WebSocket server and triggers workflows when messages are received
- WebSocket Response Node: Sends responses back to connected WebSocket clients
- Configurable port and path settings
- Automatic server cleanup and resource management
- Built-in retry mechanism for reliable message delivery
- Detailed debug logging

## Installation

To install this package in your n8n instance:

```bash
npm install n8n-nodes-websocket
```

## Usage

### WebSocket Trigger Node

1. Add a "WebSocket Trigger" node to your workflow
2. Configure the port (default: 5680) and path (default: /ws)
3. The node will create a WebSocket server and wait for connections
4. When a message is received, it will trigger the workflow with the message data

### WebSocket Response Node

1. Add a "WebSocket Response" node after your processing nodes
2. Configure the response data you want to send back
3. The node will automatically use the server and client IDs from the trigger
4. Messages will be sent back to the correct client

## Example Workflow

Here's a simple echo server workflow:

1. Add a WebSocket Trigger node (port: 5680, path: /ws)
2. Add a WebSocket Response node
3. Connect them together
4. Set the Response node to send back the received message

Now any message sent to ws://your-server:5680/ws will be echoed back.

## Development

To build the package:

```bash
npm install
npm run build
```

To run tests:

```bash
npm test
```

## License

MIT

## Support

For issues and feature requests, please create an issue on GitHub. 