"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobFields = exports.jobOperations = void 0;
exports.jobOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        description: 'Choose an operation',
        required: true,
        displayOptions: {
            show: {
                resource: ['job'],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
                description: 'Get job details',
                action: 'Get a job',
            },
            {
                name: 'Report',
                value: 'report',
                description: 'Get job report',
                action: 'Get a job report',
            },
        ],
        default: 'get',
    },
];
exports.jobFields = [
    {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['job'],
                operation: ['get', 'report'],
            },
        },
        default: '',
        description: 'ID of the job',
    },
];
//# sourceMappingURL=JobDescription.js.map