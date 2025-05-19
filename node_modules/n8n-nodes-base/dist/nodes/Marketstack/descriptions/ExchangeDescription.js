"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeFields = exports.exchangeOperations = void 0;
exports.exchangeOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Get',
                value: 'get',
                action: 'Get an exchange',
            },
        ],
        default: 'get',
        displayOptions: {
            show: {
                resource: ['exchange'],
            },
        },
    },
];
exports.exchangeFields = [
    {
        displayName: 'Exchange',
        name: 'exchange',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['exchange'],
                operation: ['get'],
            },
        },
        default: '',
        description: 'Stock exchange to retrieve, specified by <a href="https://en.wikipedia.org/wiki/Market_Identifier_Code">Market Identifier Code</a>, e.g. <code>XNAS</code>',
    },
];
//# sourceMappingURL=ExchangeDescription.js.map