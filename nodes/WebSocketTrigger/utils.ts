import basicAuth from 'basic-auth';
import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'http';
import type { IDataObject, ICredentialDataDecryptedObject } from 'n8n-workflow';

export class WebSocketAuthorizationError extends Error {
  responseCode: number;
  
  constructor(responseCode: number, message?: string) {
    super(message || 'Authorization failed');
    this.responseCode = responseCode;
    this.name = 'WebSocketAuthorizationError';
  }
}

export async function validateWebSocketAuthentication(
  req: IncomingMessage,
  authentication: string,
  getCredentials: (type: string) => Promise<ICredentialDataDecryptedObject | undefined>
): Promise<IDataObject | undefined> {
  if (authentication === 'none') return;

  const headers = req.headers;

  if (authentication === 'basicAuth') {
    // Basic authorization is needed to call websocket
    let expectedAuth: ICredentialDataDecryptedObject | undefined;
    try {
      expectedAuth = await getCredentials('httpBasicAuth');
    } catch {}

    if (expectedAuth === undefined || !expectedAuth.user || !expectedAuth.password) {
      // Data is not defined on node so can not authenticate
      throw new WebSocketAuthorizationError(500, 'No authentication data defined on node!');
    }

    const providedAuth = basicAuth(req);
    // Authorization data is missing
    if (!providedAuth) throw new WebSocketAuthorizationError(401);

    if (providedAuth.name !== expectedAuth.user || providedAuth.pass !== expectedAuth.password) {
      // Provided authentication data is wrong
      throw new WebSocketAuthorizationError(403);
    }
  } else if (authentication === 'headerAuth') {
    // Special header with value is needed to call websocket
    let expectedAuth: ICredentialDataDecryptedObject | undefined;
    try {
      expectedAuth = await getCredentials('httpHeaderAuth');
    } catch {}

    if (expectedAuth === undefined || !expectedAuth.name || !expectedAuth.value) {
      // Data is not defined on node so can not authenticate
      throw new WebSocketAuthorizationError(500, 'No authentication data defined on node!');
    }
    const headerName = (expectedAuth.name as string).toLowerCase();
    const expectedValue = expectedAuth.value as string;

    if (
      !headers.hasOwnProperty(headerName) ||
      headers[headerName] !== expectedValue
    ) {
      // Provided authentication data is wrong
      throw new WebSocketAuthorizationError(403);
    }
  } else if (authentication === 'jwtAuth') {
    let expectedAuth;

    try {
      expectedAuth = await getCredentials('jwtAuth') as {
        keyType: 'passphrase' | 'pemKey';
        publicKey: string;
        secret: string;
        algorithm: jwt.Algorithm;
      };
    } catch {}

    if (expectedAuth === undefined) {
      // Data is not defined on node so can not authenticate
      throw new WebSocketAuthorizationError(500, 'No authentication data defined on node!');
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new WebSocketAuthorizationError(401, 'No token provided');
    }

    let secretOrPublicKey;

    if (expectedAuth.keyType === 'passphrase') {
      secretOrPublicKey = expectedAuth.secret;
    } else {
      // For WebSocket, we need to format the key properly
      // This is a simplified version - you might need to import the formatPrivateKey function
      secretOrPublicKey = expectedAuth.publicKey;
    }

    try {
      return jwt.verify(token, secretOrPublicKey, {
        algorithms: [expectedAuth.algorithm],
      }) as IDataObject;
    } catch (error: any) {
      throw new WebSocketAuthorizationError(403, error.message);
    }
  }
}