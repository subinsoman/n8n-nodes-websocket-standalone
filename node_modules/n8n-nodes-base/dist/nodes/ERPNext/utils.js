"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSQL = exports.processNames = void 0;
const flow_1 = __importDefault(require("lodash/flow"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const uniqBy_1 = __importDefault(require("lodash/uniqBy"));
const ensureName = (docFields) => docFields.filter((o) => o.name);
const sortByName = (docFields) => (0, sortBy_1.default)(docFields, ['name']);
const uniqueByName = (docFields) => (0, uniqBy_1.default)(docFields, (o) => o.name);
exports.processNames = (0, flow_1.default)(ensureName, sortByName, uniqueByName);
const toSQL = (operator) => {
    const operators = {
        is: '=',
        isNot: '!=',
        greater: '>',
        less: '<',
        equalsGreater: '>=',
        equalsLess: '<=',
    };
    return operators[operator];
};
exports.toSQL = toSQL;
//# sourceMappingURL=utils.js.map