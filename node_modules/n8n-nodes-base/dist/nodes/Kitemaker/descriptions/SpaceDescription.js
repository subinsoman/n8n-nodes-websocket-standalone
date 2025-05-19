"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spaceFields = exports.spaceOperations = void 0;
exports.spaceOperations = [
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
                description: "Retrieve data on many spaces in the logged-in user's organization",
                action: 'Get many spaces',
            },
        ],
        displayOptions: {
            show: {
                resource: ['space'],
            },
        },
    },
];
exports.spaceFields = [
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
            show: {
                resource: ['space'],
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
                resource: ['space'],
                operation: ['getAll'],
                returnAll: [false],
            },
        },
    },
];
//# sourceMappingURL=SpaceDescription.js.map