"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileDelDescription = void 0;
exports.fileDelDescription = [
    {
        displayName: 'File ID',
        name: 'fileId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                operation: ['delete'],
                resource: ['file'],
            },
        },
        default: '',
        description: 'ID of the file',
    },
];
//# sourceMappingURL=description.js.map