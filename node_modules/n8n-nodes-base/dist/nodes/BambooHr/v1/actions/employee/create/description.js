"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeCreateDescription = void 0;
const shareDescription_1 = require("./shareDescription");
exports.employeeCreateDescription = [
    {
        displayName: 'Synced with Trax Payroll',
        name: 'synced',
        type: 'boolean',
        required: true,
        displayOptions: {
            show: {
                operation: ['create'],
                resource: ['employee'],
            },
        },
        default: false,
        description: 'Whether the employee to create was added to a pay schedule synced with Trax Payroll',
    },
    {
        displayName: 'First Name',
        name: 'firstName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: ['create'],
                resource: ['employee'],
            },
        },
        default: '',
    },
    {
        displayName: 'Last Name',
        name: 'lastName',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: ['create'],
                resource: ['employee'],
            },
        },
        default: '',
    },
    ...(0, shareDescription_1.createEmployeeSharedDescription)(true),
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                operation: ['create'],
                resource: ['employee'],
            },
        },
        options: [
            ...(0, shareDescription_1.createEmployeeSharedDescription)(false),
            {
                displayName: 'Work Email',
                name: 'workEmail',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Work Phone',
                name: 'workPhone',
                type: 'string',
                default: '',
            },
        ],
    },
];
//# sourceMappingURL=description.js.map