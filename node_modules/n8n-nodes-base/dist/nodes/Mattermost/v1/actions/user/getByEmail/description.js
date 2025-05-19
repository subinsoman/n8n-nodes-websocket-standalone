"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGetByEmailDescription = void 0;
exports.userGetByEmailDescription = [
    {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getByEmail'],
            },
        },
        default: '',
        description: "User's email",
    },
];
//# sourceMappingURL=description.js.map