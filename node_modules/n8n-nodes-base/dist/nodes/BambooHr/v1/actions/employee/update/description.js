"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeUpdateDescription = void 0;
const sharedDescription_1 = require("./sharedDescription");
exports.employeeUpdateDescription = [
    {
        displayName: 'Employee ID',
        name: 'employeeId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: ['update'],
                resource: ['employee'],
            },
        },
        default: '',
    },
    {
        displayName: 'Synced with Trax Payroll',
        name: 'synced',
        type: 'boolean',
        required: true,
        displayOptions: {
            show: {
                operation: ['update'],
                resource: ['employee'],
            },
        },
        default: false,
        description: 'Whether the employee to create was added to a pay schedule synced with Trax Payroll',
    },
    ...(0, sharedDescription_1.updateEmployeeSharedDescription)(true),
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                operation: ['update'],
                resource: ['employee'],
            },
        },
        options: [
            ...(0, sharedDescription_1.updateEmployeeSharedDescription)(false),
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