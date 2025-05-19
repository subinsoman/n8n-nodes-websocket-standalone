"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractValue = void 0;
const n8n_workflow_1 = require("n8n-workflow");
function findPropertyFromParameterName(parameterName, nodeType, node, nodeParameters) {
    let property;
    const paramParts = parameterName.split('.');
    let currentParamPath = '';
    const findProp = (name, options) => {
        return options.find((i) => i.name === name &&
            n8n_workflow_1.NodeHelpers.displayParameterPath(nodeParameters, i, currentParamPath, node));
    };
    for (const p of paramParts) {
        const param = p.split('[')[0];
        if (!property) {
            property = findProp(param, nodeType.description.properties);
        }
        else if ('options' in property && property.options) {
            property = findProp(param, property.options);
            currentParamPath += `.${param}`;
        }
        else if ('values' in property) {
            property = findProp(param, property.values);
            currentParamPath += `.${param}`;
        }
        else {
            throw new Error(`Couldn't not find property "${parameterName}"`);
        }
        if (!property) {
            throw new Error(`Couldn't not find property "${parameterName}"`);
        }
    }
    if (!property) {
        throw new Error(`Couldn't not find property "${parameterName}"`);
    }
    return property;
}
function executeRegexExtractValue(value, regex, parameterName, parameterDisplayName) {
    const extracted = regex.exec(value);
    if (!extracted) {
        throw new Error(`ERROR: ${parameterDisplayName} parameter's value is invalid. This is likely because the URL entered is incorrect`);
    }
    if (extracted.length < 2 || extracted.length > 2) {
        throw new Error(`Property "${parameterName}" has an invalid extractValue regex "${regex.source}". extractValue expects exactly one group to be returned.`);
    }
    return extracted[1];
}
function extractValueRLC(value, property, parameterName) {
    var _a, _b;
    if (typeof value !== 'object' || !value || !('mode' in value) || !('value' in value)) {
        return value;
    }
    const modeProp = ((_a = property.modes) !== null && _a !== void 0 ? _a : []).find((i) => i.name === value.mode);
    if (!modeProp) {
        return value.value;
    }
    if (!('extractValue' in modeProp) || !modeProp.extractValue) {
        return value.value;
    }
    if (typeof value.value !== 'string') {
        let typeName = (_b = value.value) === null || _b === void 0 ? void 0 : _b.constructor.name;
        if (value.value === null) {
            typeName = 'null';
        }
        else if (typeName === undefined) {
            typeName = 'undefined';
        }
        n8n_workflow_1.LoggerProxy.error(`Only strings can be passed to extractValue. Parameter "${parameterName}" passed "${typeName}"`);
        throw new Error(`ERROR: ${property.displayName} parameter's value is invalid. Please enter a valid ${modeProp.displayName}.`);
    }
    if (modeProp.extractValue.type !== 'regex') {
        throw new Error(`Property "${parameterName}" has an unknown extractValue type "${modeProp.extractValue.type}"`);
    }
    const regex = new RegExp(modeProp.extractValue.regex);
    return executeRegexExtractValue(value.value, regex, parameterName, property.displayName);
}
function extractValueOther(value, property, parameterName) {
    if (!('extractValue' in property) || !property.extractValue) {
        return value;
    }
    if (typeof value !== 'string') {
        let typeName = value === null || value === void 0 ? void 0 : value.constructor.name;
        if (value === null) {
            typeName = 'null';
        }
        else if (typeName === undefined) {
            typeName = 'undefined';
        }
        n8n_workflow_1.LoggerProxy.error(`Only strings can be passed to extractValue. Parameter "${parameterName}" passed "${typeName}"`);
        throw new Error(`ERROR: ${property.displayName} parameter's value is invalid. Please enter a valid value.`);
    }
    if (property.extractValue.type !== 'regex') {
        throw new Error(`Property "${parameterName}" has an unknown extractValue type "${property.extractValue.type}"`);
    }
    const regex = new RegExp(property.extractValue.regex);
    return executeRegexExtractValue(value, regex, parameterName, property.displayName);
}
function extractValue(value, parameterName, node, nodeType) {
    let property;
    try {
        property = findPropertyFromParameterName(parameterName, nodeType, node, node.parameters);
        if (!('type' in property)) {
            return value;
        }
        if (property.type === 'resourceLocator') {
            return extractValueRLC(value, property, parameterName);
        }
        return extractValueOther(value, property, parameterName);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(node, error);
    }
}
exports.extractValue = extractValue;
//# sourceMappingURL=ExtractValue.js.map