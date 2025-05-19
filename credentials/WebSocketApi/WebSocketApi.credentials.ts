import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WebSocketApi implements ICredentialType {
	name = 'webSocketApi';
	displayName = 'WebSocket API';
	documentationUrl = 'https://docs.n8n.io/credentials/webSocketApi';
	properties: INodeProperties[] = [
		{
			displayName: 'No Authentication Required',
			name: 'noAuth',
			type: 'boolean',
			default: true,
		},
	];
} 