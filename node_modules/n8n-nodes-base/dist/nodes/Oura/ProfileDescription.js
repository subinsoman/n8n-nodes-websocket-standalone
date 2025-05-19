"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileOperations = void 0;
exports.profileOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['profile'],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
                description: "Get the user's personal information",
                action: 'Get a profile',
            },
        ],
        default: 'get',
    },
];
//# sourceMappingURL=ProfileDescription.js.map