"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.asQR = void 0;
var rxjs_1 = require("rxjs");
var qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
var asQR = function (str) {
    return new rxjs_1.Observable(function (o) {
        return qrcode_terminal_1["default"].generate(str, function (r) {
            o.next(r);
            o.complete();
        });
    });
};
exports.asQR = asQR;
//# sourceMappingURL=qr.js.map