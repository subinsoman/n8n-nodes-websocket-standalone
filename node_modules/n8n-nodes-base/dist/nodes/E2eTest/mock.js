"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchOptions = exports.resourceMapperFields = exports.remoteOptions = exports.returnData = void 0;
const minifaker_1 = require("minifaker");
require("minifaker/locales/en");
exports.returnData = [
    {
        json: {
            id: '23423532',
            name: 'Hello World',
        },
    },
];
exports.remoteOptions = [
    {
        name: 'Resource 1',
        value: 'resource1',
    },
    {
        name: 'Resource 2',
        value: 'resource2',
    },
    {
        name: 'Resource 3',
        value: 'resource3',
    },
];
exports.resourceMapperFields = {
    fields: [
        {
            id: 'id',
            displayName: 'ID',
            defaultMatch: true,
            canBeUsedToMatch: true,
            required: true,
            display: true,
            type: 'string',
        },
        {
            id: 'name',
            displayName: 'Name',
            defaultMatch: false,
            canBeUsedToMatch: false,
            required: false,
            display: true,
            type: 'string',
        },
        {
            id: 'age',
            displayName: 'Age',
            defaultMatch: false,
            canBeUsedToMatch: false,
            required: false,
            display: true,
            type: 'number',
        },
    ],
};
exports.searchOptions = (0, minifaker_1.array)(100, () => {
    const value = minifaker_1.uuid.v4();
    return {
        name: (0, minifaker_1.name)(),
        value,
        url: 'https://example.com/user/' + value,
    };
});
//# sourceMappingURL=mock.js.map