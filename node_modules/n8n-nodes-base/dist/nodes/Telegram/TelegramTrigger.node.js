"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramTrigger = void 0;
const GenericFunctions_1 = require("./GenericFunctions");
class TelegramTrigger {
    constructor() {
        this.description = {
            displayName: 'Telegram Trigger',
            name: 'telegramTrigger',
            icon: 'file:telegram.svg',
            group: ['trigger'],
            version: 1,
            subtitle: '=Updates: {{$parameter["updates"].join(", ")}}',
            description: 'Starts the workflow on a Telegram update',
            defaults: {
                name: 'Telegram Trigger',
            },
            inputs: [],
            outputs: ['main'],
            credentials: [
                {
                    name: 'telegramApi',
                    required: true,
                },
            ],
            webhooks: [
                {
                    name: 'default',
                    httpMethod: 'POST',
                    responseMode: 'onReceived',
                    path: 'webhook',
                },
            ],
            properties: [
                {
                    displayName: 'Trigger On',
                    name: 'updates',
                    type: 'multiOptions',
                    options: [
                        {
                            name: '*',
                            value: '*',
                            description: 'All updates',
                        },
                        {
                            name: 'Callback Query',
                            value: 'callback_query',
                            description: 'Trigger on new incoming callback query',
                        },
                        {
                            name: 'Channel Post',
                            value: 'channel_post',
                            description: 'Trigger on new incoming channel post of any kind — text, photo, sticker, etc',
                        },
                        {
                            name: 'Edited Channel Post',
                            value: 'edited_channel_post',
                            description: 'Trigger on new version of a channel post that is known to the bot and was edited',
                        },
                        {
                            name: 'Edited Message',
                            value: 'edited_message',
                            description: 'Trigger on new version of a channel post that is known to the bot and was edited',
                        },
                        {
                            name: 'Inline Query',
                            value: 'inline_query',
                            description: 'Trigger on new incoming inline query',
                        },
                        {
                            name: 'Message',
                            value: 'message',
                            description: 'Trigger on new incoming message of any kind — text, photo, sticker, etc',
                        },
                        {
                            name: 'Poll',
                            value: 'poll',
                            action: 'On Poll Change',
                            description: 'Trigger on new poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot.',
                        },
                        {
                            name: 'Pre-Checkout Query',
                            value: 'pre_checkout_query',
                            description: 'Trigger on new incoming pre-checkout query. Contains full information about checkout.',
                        },
                        {
                            name: 'Shipping Query',
                            value: 'shipping_query',
                            description: 'Trigger on new incoming shipping query. Only for invoices with flexible price.',
                        },
                    ],
                    required: true,
                    default: [],
                },
                {
                    displayName: 'Every uploaded attachment, even if sent in a group, will trigger a separate event. You can identify that an attachment belongs to a certain group by <code>media_group_id</code> .',
                    name: 'attachmentNotice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Additional Fields',
                    name: 'additionalFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    options: [
                        {
                            displayName: 'Download Images/Files',
                            name: 'download',
                            type: 'boolean',
                            default: false,
                            description: "Telegram delivers the image in multiple sizes. By default, just the large image would be downloaded. If you want to change the size, set the field 'Image Size'.",
                        },
                        {
                            displayName: 'Image Size',
                            name: 'imageSize',
                            type: 'options',
                            displayOptions: {
                                show: {
                                    download: [true],
                                },
                            },
                            options: [
                                {
                                    name: 'Small',
                                    value: 'small',
                                },
                                {
                                    name: 'Medium',
                                    value: 'medium',
                                },
                                {
                                    name: 'Large',
                                    value: 'large',
                                },
                                {
                                    name: 'Extra Large',
                                    value: 'extraLarge',
                                },
                            ],
                            default: 'large',
                            description: 'The size of the image to be downloaded',
                        },
                    ],
                },
            ],
        };
        this.webhookMethods = {
            default: {
                async checkExists() {
                    const endpoint = 'getWebhookInfo';
                    const webhookReturnData = await GenericFunctions_1.apiRequest.call(this, 'POST', endpoint, {});
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    if (webhookReturnData.result.url === webhookUrl) {
                        return true;
                    }
                    return false;
                },
                async create() {
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    let allowedUpdates = this.getNodeParameter('updates');
                    if ((allowedUpdates || []).includes('*')) {
                        allowedUpdates = [];
                    }
                    const endpoint = 'setWebhook';
                    const body = {
                        url: webhookUrl,
                        allowed_updates: allowedUpdates,
                    };
                    await GenericFunctions_1.apiRequest.call(this, 'POST', endpoint, body);
                    return true;
                },
                async delete() {
                    const endpoint = 'deleteWebhook';
                    const body = {};
                    try {
                        await GenericFunctions_1.apiRequest.call(this, 'POST', endpoint, body);
                    }
                    catch (error) {
                        return false;
                    }
                    return true;
                },
            },
        };
    }
    async webhook() {
        var _a, _b, _c, _d, _e, _f, _g;
        const credentials = await this.getCredentials('telegramApi');
        const bodyData = this.getBodyData();
        const additionalFields = this.getNodeParameter('additionalFields');
        if (additionalFields.download === true) {
            let imageSize = 'large';
            let key = 'message';
            if (bodyData.channel_post) {
                key = 'channel_post';
            }
            if ((((_a = bodyData[key]) === null || _a === void 0 ? void 0 : _a.photo) && Array.isArray((_b = bodyData[key]) === null || _b === void 0 ? void 0 : _b.photo)) ||
                ((_c = bodyData[key]) === null || _c === void 0 ? void 0 : _c.document)) {
                if (additionalFields.imageSize) {
                    imageSize = additionalFields.imageSize;
                }
                let fileId;
                if ((_d = bodyData[key]) === null || _d === void 0 ? void 0 : _d.photo) {
                    let image = (0, GenericFunctions_1.getImageBySize)((_e = bodyData[key]) === null || _e === void 0 ? void 0 : _e.photo, imageSize);
                    if (image === undefined) {
                        image = bodyData[key].photo[0];
                    }
                    fileId = image.file_id;
                }
                else {
                    fileId = (_g = (_f = bodyData[key]) === null || _f === void 0 ? void 0 : _f.document) === null || _g === void 0 ? void 0 : _g.file_id;
                }
                const { result: { file_path }, } = await GenericFunctions_1.apiRequest.call(this, 'GET', `getFile?file_id=${fileId}`, {});
                const file = await GenericFunctions_1.apiRequest.call(this, 'GET', '', {}, {}, {
                    json: false,
                    encoding: null,
                    uri: `https://api.telegram.org/file/bot${credentials.accessToken}/${file_path}`,
                    resolveWithFullResponse: true,
                });
                const data = Buffer.from(file.body);
                const fileName = file_path.split('/').pop();
                const binaryData = await this.helpers.prepareBinaryData(data, fileName);
                return {
                    workflowData: [
                        [
                            {
                                json: bodyData,
                                binary: {
                                    data: binaryData,
                                },
                            },
                        ],
                    ],
                };
            }
        }
        return {
            workflowData: [this.helpers.returnJsonArray([bodyData])],
        };
    }
}
exports.TelegramTrigger = TelegramTrigger;
//# sourceMappingURL=TelegramTrigger.node.js.map