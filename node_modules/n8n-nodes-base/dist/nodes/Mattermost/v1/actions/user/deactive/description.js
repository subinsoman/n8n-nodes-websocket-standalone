"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDeactiveDescription = void 0;
exports.userDeactiveDescription = [
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['deactive'],
            },
        },
        default: '',
        description: 'User GUID',
    },
];
//# sourceMappingURL=description.js.map