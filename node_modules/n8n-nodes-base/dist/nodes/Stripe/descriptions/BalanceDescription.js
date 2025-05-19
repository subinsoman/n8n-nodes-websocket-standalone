"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceOperations = void 0;
exports.balanceOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        default: 'get',
        options: [
            {
                name: 'Get',
                value: 'get',
                description: 'Get a balance',
                action: 'Get a balance',
            },
        ],
        displayOptions: {
            show: {
                resource: ['balance'],
            },
        },
    },
];
//# sourceMappingURL=BalanceDescription.js.map