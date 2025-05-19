const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5680/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  // Send a test message
  ws.send(JSON.stringify({ test: 'Hello server' }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from server');
}); 