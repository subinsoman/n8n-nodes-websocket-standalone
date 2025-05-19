"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fields = exports.operations = exports.resource = void 0;
exports.resource = {
    name: 'Space',
    value: 'space',
};
exports.operations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: [exports.resource.value],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
            },
        ],
        default: 'get',
    },
];
exports.fields = [];
//# sourceMappingURL=SpaceDescription.js.map