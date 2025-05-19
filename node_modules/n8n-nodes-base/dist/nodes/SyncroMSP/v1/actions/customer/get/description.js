"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerGetDescription = void 0;
exports.customerGetDescription = [
    {
        displayName: 'Cutomer ID',
        name: 'customerId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['customer'],
                operation: ['get'],
            },
        },
        default: '',
        description: 'Get specific customer by ID',
    },
];
//# sourceMappingURL=description.js.map