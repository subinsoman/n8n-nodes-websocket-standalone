"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientCredentialsToken = void 0;
const getClientCredentialsToken = async (oAuth2Client, credentials) => {
    const options = {};
    if (credentials.authentication === 'body') {
        Object.assign(options, {
            headers: {
                Authorization: '',
            },
            body: {
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
            },
        });
    }
    return oAuth2Client.credentials.getToken(options);
};
exports.getClientCredentialsToken = getClientCredentialsToken;
//# sourceMappingURL=OAuth2Helper.js.map