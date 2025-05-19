"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFileAsync = util_1.promisify(fs_1.default.readFile);
const ENCODING = 'utf-8';
function readAVSC(path) {
    return JSON.parse(fs_1.default.readFileSync(path, ENCODING));
}
exports.readAVSC = readAVSC;
async function readAVSCAsync(path) {
    const file = await readFileAsync(path, ENCODING);
    return JSON.parse(file);
}
exports.readAVSCAsync = readAVSCAsync;
//# sourceMappingURL=readAVSC.js.map