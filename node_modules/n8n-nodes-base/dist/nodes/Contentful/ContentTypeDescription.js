"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fields = exports.operations = exports.resource = void 0;
exports.resource = {
    name: 'Content Type',
    value: 'contentType',
};
exports.operations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: [exports.resource.value],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
            },
        ],
        default: 'get',
    },
];
exports.fields = [
    {
        displayName: 'Environment ID',
        name: 'environmentId',
        type: 'string',
        displayOptions: {
            show: {
                resource: [exports.resource.value],
                operation: ['get'],
            },
        },
        default: 'master',
        description: 'The ID for the Contentful environment (e.g. master, staging, etc.). Depending on your plan, you might not have environments. In that case use "master".',
    },
    {
        displayName: 'Content Type ID',
        name: 'contentTypeId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: [exports.resource.value],
                operation: ['get'],
            },
        },
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: [exports.resource.value],
                operation: ['get'],
            },
        },
        options: [
            {
                displayName: 'RAW Data',
                name: 'rawData',
                type: 'boolean',
                default: false,
                description: 'Whether the data should be returned RAW instead of parsed',
            },
        ],
    },
];
//# sourceMappingURL=ContentTypeDescription.js.map