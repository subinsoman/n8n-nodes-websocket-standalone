"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketDeleteDescription = void 0;
exports.ticketDeleteDescription = [
    {
        displayName: 'Ticket ID',
        name: 'ticketId',
        required: true,
        type: 'string',
        displayOptions: {
            show: {
                resource: ['ticket'],
                operation: ['delete'],
            },
        },
        default: '',
        description: 'Delete a specific customer by ID',
    },
];
//# sourceMappingURL=description.js.map