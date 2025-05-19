"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fields = exports.operations = exports.resource = void 0;
exports.resource = {
    name: 'Locale',
    value: 'locale',
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
                name: 'Get Many',
                value: 'getAll',
            },
        ],
        default: 'getAll',
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
                operation: ['get', 'getAll'],
            },
        },
        default: 'master',
        description: 'The ID for the Contentful environment (e.g. master, staging, etc.). Depending on your plan, you might not have environments. In that case use "master".',
    },
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        displayOptions: {
            show: {
                operation: ['getAll'],
                resource: [exports.resource.value],
            },
        },
        default: false,
        description: 'Whether to return all results or only up to a given limit',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                operation: ['getAll'],
                resource: [exports.resource.value],
                returnAll: [false],
            },
        },
        typeOptions: {
            minValue: 1,
            maxValue: 500,
        },
        default: 100,
        description: 'Max number of results to return',
    },
];
//# sourceMappingURL=LocaleDescription.js.map