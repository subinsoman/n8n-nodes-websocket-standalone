"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mappersmith_1 = __importDefault(require("mappersmith"));
const v2_1 = __importDefault(require("mappersmith/middleware/retry/v2"));
const basic_auth_1 = __importDefault(require("mappersmith/middleware/basic-auth"));
const constants_1 = require("../constants");
const errorMiddleware_1 = __importDefault(require("./middleware/errorMiddleware"));
const confluentEncoderMiddleware_1 = __importDefault(require("./middleware/confluentEncoderMiddleware"));
const DEFAULT_RETRY = {
    maxRetryTimeInSecs: 5,
    initialRetryTimeInSecs: 0.1,
    factor: 0.2,
    multiplier: 2,
    retries: 3,
};
exports.default = ({ auth, clientId, host, retry = {}, }) => mappersmith_1.default({
    clientId: clientId || constants_1.DEFAULT_API_CLIENT_ID,
    ignoreGlobalMiddleware: true,
    host,
    middleware: [
        confluentEncoderMiddleware_1.default,
        v2_1.default(Object.assign(DEFAULT_RETRY, retry)),
        errorMiddleware_1.default,
        ...(auth ? [basic_auth_1.default(auth)] : []),
    ],
    resources: {
        Schema: {
            find: {
                method: 'get',
                path: '/schemas/ids/{id}',
            },
        },
        Subject: {
            all: {
                method: 'get',
                path: '/subjects',
            },
            latestVersion: {
                method: 'get',
                path: '/subjects/{subject}/versions/latest',
            },
            version: {
                method: 'get',
                path: '/subjects/{subject}/versions/{version}',
            },
            registered: {
                method: 'post',
                path: '/subjects/{subject}',
            },
            config: {
                method: 'get',
                path: '/config/{subject}',
            },
            updateConfig: {
                method: 'put',
                path: '/config/{subject}',
            },
            register: {
                method: 'post',
                path: '/subjects/{subject}/versions',
            },
            compatible: {
                method: 'post',
                path: '/compatibility/subjects/{subject}/versions/{version}',
                params: { version: 'latest' },
            },
        },
    },
});
//# sourceMappingURL=index.js.map