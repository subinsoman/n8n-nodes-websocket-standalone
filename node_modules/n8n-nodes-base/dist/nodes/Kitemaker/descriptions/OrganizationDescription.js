"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationOperations = void 0;
exports.organizationOperations = [
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
                description: "Retrieve data on the logged-in user's organization",
                action: "Get the logged-in user's organization",
            },
        ],
        displayOptions: {
            show: {
                resource: ['organization'],
            },
        },
    },
];
//# sourceMappingURL=OrganizationDescription.js.map