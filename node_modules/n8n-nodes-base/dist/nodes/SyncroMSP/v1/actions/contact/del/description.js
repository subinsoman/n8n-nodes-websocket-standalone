"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactDeleteDescription = void 0;
exports.contactDeleteDescription = [
    {
        displayName: 'Contact ID',
        name: 'contactId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['contact'],
                operation: ['delete'],
            },
        },
        default: '',
        description: 'Delete a specific contact by ID',
    },
];
//# sourceMappingURL=description.js.map