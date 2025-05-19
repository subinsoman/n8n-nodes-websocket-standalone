"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactUpdateDescription = void 0;
const sharedFields_1 = require("../../../methods/sharedFields");
exports.contactUpdateDescription = [
    {
        displayName: 'Contact ID',
        name: 'contactId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['contact'],
                operation: ['update'],
            },
        },
        default: '',
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        displayOptions: {
            show: {
                resource: ['contact'],
                operation: ['update'],
            },
        },
        default: {},
        options: [
            sharedFields_1.addressFixedCollection,
            {
                displayName: 'Customer ID',
                name: 'customerId',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                placeholder: 'name@email.com',
                default: '',
            },
            {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Notes',
                name: 'notes',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Phone',
                name: 'phone',
                type: 'string',
                default: '',
            },
        ],
    },
];
//# sourceMappingURL=description.js.map