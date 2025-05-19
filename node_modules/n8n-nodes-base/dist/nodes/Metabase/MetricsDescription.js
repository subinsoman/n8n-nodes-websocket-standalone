"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsFields = exports.metricsOperations = void 0;
exports.metricsOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['metrics'],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
                description: 'Get a specific metric',
                routing: {
                    request: {
                        method: 'GET',
                        url: '={{"/api/metric/" + $parameter.metricId}}',
                        returnFullResponse: true,
                    },
                },
                action: 'Get a metric',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many metrics',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/api/metric/',
                    },
                },
                action: 'Get many metrics',
            },
        ],
        default: 'getAll',
    },
];
exports.metricsFields = [
    {
        displayName: 'Metric ID',
        name: 'metricId',
        type: 'string',
        required: true,
        placeholder: '0',
        displayOptions: {
            show: {
                resource: ['metrics'],
                operation: ['get'],
            },
        },
        default: '',
    },
];
//# sourceMappingURL=MetricsDescription.js.map