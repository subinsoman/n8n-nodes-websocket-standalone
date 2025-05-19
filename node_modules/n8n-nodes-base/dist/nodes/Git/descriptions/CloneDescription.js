"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneFields = void 0;
exports.cloneFields = [
    {
        displayName: 'Source Repository',
        name: 'sourceRepository',
        type: 'string',
        displayOptions: {
            show: {
                operation: ['clone'],
            },
        },
        default: '',
        placeholder: 'https://github.com/n8n-io/n8n',
        description: 'The URL or path of the repository to clone',
        required: true,
    },
];
//# sourceMappingURL=CloneDescription.js.map