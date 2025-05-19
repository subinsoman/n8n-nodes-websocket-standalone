"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.binaryToBuffer = void 0;
const concat_stream_1 = __importDefault(require("concat-stream"));
const binaryToBuffer = async (body) => new Promise((resolve) => {
    if (Buffer.isBuffer(body))
        resolve(body);
    else
        body.pipe((0, concat_stream_1.default)(resolve));
});
exports.binaryToBuffer = binaryToBuffer;
//# sourceMappingURL=utils.js.map