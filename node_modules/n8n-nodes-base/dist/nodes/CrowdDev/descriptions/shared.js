"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailsField = void 0;
exports.emailsField = {
    displayName: 'Emails',
    name: 'emails',
    description: 'Email addresses of the member',
    type: 'fixedCollection',
    typeOptions: {
        multipleValues: true,
    },
    default: {},
    options: [
        {
            displayName: 'Item Choice',
            name: 'itemChoice',
            values: [
                {
                    displayName: 'Email',
                    name: 'email',
                    type: 'string',
                    placeholder: 'name@email.com',
                    default: '',
                },
            ],
        },
    ],
};
//# sourceMappingURL=shared.js.map