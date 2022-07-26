"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.inferSignedOperations = exports.inferSignedOperationsOpts = void 0;
var operators_1 = require("rxjs/operators");
var invariant_1 = __importDefault(require("invariant"));
var transaction_1 = require("@ledgerhq/live-common/lib/transaction");
var stream_1 = require("./stream");
exports.inferSignedOperationsOpts = [
    {
        name: "signed-operation",
        alias: "t",
        type: String,
        desc: "JSON file of a signed operation (- for stdin)"
    },
];
function inferSignedOperations(mainAccount, opts) {
    var file = opts["signed-operation"];
    (0, invariant_1["default"])(file, "--signed-operation file is required");
    return (0, stream_1.jsonFromFile)(file).pipe((0, operators_1.map)(function (json) {
        (0, invariant_1["default"])(typeof json === "object", "not an object JSON");
        (0, invariant_1["default"])(typeof json.signature === "string", "missing signature");
        (0, invariant_1["default"])(typeof json.operation === "object", "missing operation object");
        (0, invariant_1["default"])(json.operation.accountId === mainAccount.id, "the operation does not match the specified account");
        return (0, transaction_1.fromSignedOperationRaw)(json, mainAccount.id);
    }));
}
exports.inferSignedOperations = inferSignedOperations;
//# sourceMappingURL=signedOperation.js.map