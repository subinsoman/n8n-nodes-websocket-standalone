"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credentials = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const crypto_js_1 = require("crypto-js");
class Credentials extends n8n_workflow_1.ICredentials {
    hasNodeAccess(nodeType) {
        for (const accessData of this.nodesAccess) {
            if (accessData.nodeType === nodeType) {
                return true;
            }
        }
        return false;
    }
    setData(data, encryptionKey) {
        this.data = crypto_js_1.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    }
    setDataKey(key, data, encryptionKey) {
        let fullData;
        try {
            fullData = this.getData(encryptionKey);
        }
        catch (e) {
            fullData = {};
        }
        fullData[key] = data;
        return this.setData(fullData, encryptionKey);
    }
    getData(encryptionKey, nodeType) {
        if (nodeType && !this.hasNodeAccess(nodeType)) {
            throw new Error(`The node of type "${nodeType}" does not have access to credentials "${this.name}" of type "${this.type}".`);
        }
        if (this.data === undefined) {
            throw new Error('No data is set so nothing can be returned.');
        }
        const decryptedData = crypto_js_1.AES.decrypt(this.data, encryptionKey);
        try {
            return JSON.parse(decryptedData.toString(crypto_js_1.enc.Utf8));
        }
        catch (e) {
            throw new Error('Credentials could not be decrypted. The likely reason is that a different "encryptionKey" was used to encrypt the data.');
        }
    }
    getDataKey(key, encryptionKey, nodeType) {
        const fullData = this.getData(encryptionKey, nodeType);
        if (fullData === null) {
            throw new Error('No data was set.');
        }
        if (!fullData.hasOwnProperty(key)) {
            throw new Error(`No data for key "${key}" exists.`);
        }
        return fullData[key];
    }
    getDataToSave() {
        if (this.data === undefined) {
            throw new Error('No credentials were set to save.');
        }
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            data: this.data,
            nodesAccess: this.nodesAccess,
        };
    }
}
exports.Credentials = Credentials;
//# sourceMappingURL=Credentials.js.map