"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGetByIdDescription = void 0;
exports.userGetByIdDescription = [
    {
        displayName: 'User IDs',
        name: 'userIds',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getById'],
            },
        },
        default: '',
        description: "User's ID",
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['getById'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Since',
                name: 'since',
                type: 'dateTime',
                default: '',
                description: 'Only return users that have been modified since the given Unix timestamp (in milliseconds)',
            },
        ],
    },
];
//# sourceMappingURL=description.js.map