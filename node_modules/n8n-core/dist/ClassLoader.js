"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadClassInIsolation = void 0;
const vm_1 = require("vm");
const context = (0, vm_1.createContext)({ require });
const loadClassInIsolation = (filePath, className) => {
    if (process.platform === 'win32') {
        filePath = filePath.replace(/\\/g, '/');
    }
    const script = new vm_1.Script(`new (require('${filePath}').${className})()`);
    return script.runInContext(context);
};
exports.loadClassInIsolation = loadClassInIsolation;
//# sourceMappingURL=ClassLoader.js.map