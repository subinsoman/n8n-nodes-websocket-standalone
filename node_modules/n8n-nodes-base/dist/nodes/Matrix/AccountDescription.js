"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountOperations = void 0;
exports.accountOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['account'],
            },
        },
        options: [
            {
                name: 'Me',
                value: 'me',
                description: "Get current user's account information",
                action: "Get the current user's account information",
            },
        ],
        default: 'me',
    },
];
//# sourceMappingURL=AccountDescription.js.map