"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventNameField = exports.eventDisplay = void 0;
const WebhookMapping_1 = require("../WebhookMapping");
const sort = (a, b) => {
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
};
exports.eventDisplay = {
    displayName: 'Trigger On',
    name: 'triggerOn',
    type: 'options',
    options: Object.keys(WebhookMapping_1.webhookMapping)
        .map((webhook) => {
        const { name, value } = WebhookMapping_1.webhookMapping[webhook];
        return { name, value };
    })
        .sort(sort),
    required: true,
    default: [],
};
exports.eventNameField = {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    options: [
        {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'A name for the webhook for identification',
        },
    ],
};
//# sourceMappingURL=OnfleetWebhookDescription.js.map