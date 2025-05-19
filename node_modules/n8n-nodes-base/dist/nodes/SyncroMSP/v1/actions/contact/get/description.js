"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactGetDescription = void 0;
exports.contactGetDescription = [
    {
        displayName: 'Contact ID',
        name: 'contactId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['contact'],
                operation: ['get'],
            },
        },
        default: '',
        description: 'Get specific contact by ID',
    },
];
//# sourceMappingURL=description.js.map