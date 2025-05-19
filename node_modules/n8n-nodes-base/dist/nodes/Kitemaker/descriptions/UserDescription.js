"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFields = exports.userOperations = void 0;
exports.userOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        default: 'getAll',
        options: [
            {
                name: 'Get Many',
                value: 'getAll',
                description: "Retrieve data on many users in the logged-in user's organization",
                action: 'Get many users',
            },
        ],
        displayOptions: {
            show: {
                resource: ['user'],
            },
        },
    },
];
exports.userFields = [
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 5,
        description: 'Max number of results to return',
        typeOptions: {
            minValue: 1,
            maxValue: 1000,
        },
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getAll'],
                returnAll: [false],
            },
        },
    },
];
//# sourceMappingURL=UserDescription.js.map