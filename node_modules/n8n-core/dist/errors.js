"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileNotFoundError = void 0;
class FileNotFoundError extends Error {
    constructor(filePath) {
        super(`File not found: ${filePath}`);
        this.filePath = filePath;
    }
}
exports.FileNotFoundError = FileNotFoundError;
//# sourceMappingURL=errors.js.map