"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var derivation_1 = require("@ledgerhq/live-common/lib/derivation");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getAddress_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getAddress"));
var scan_1 = require("../scan");
exports["default"] = {
    description: "Get an address with the device on specific derivations (advanced)",
    args: [
        scan_1.currencyOpt,
        scan_1.deviceOpt,
        {
            name: "path",
            type: String,
            desc: "HDD derivation path"
        },
        {
            name: "derivationMode",
            type: String,
            desc: "derivationMode to use"
        },
        {
            name: "verify",
            alias: "v",
            type: Boolean,
            desc: "also ask verification on device"
        },
    ],
    job: function (arg) {
        return (0, scan_1.inferCurrency)(arg).pipe((0, operators_1.mergeMap)(function (currency) {
            if (!currency) {
                throw new Error("no currency provided");
            }
            if (!arg.path) {
                throw new Error("--path is required");
            }
            (0, derivation_1.asDerivationMode)(arg.derivationMode);
            return (0, deviceAccess_1.withDevice)(arg.device || "")(function (t) {
                return (0, rxjs_1.from)((0, getAddress_1["default"])(t, {
                    currency: currency,
                    path: arg.path,
                    derivationMode: (0, derivation_1.asDerivationMode)(arg.derivationMode || "")
                }));
            });
        }));
    }
};
//# sourceMappingURL=getAddress.js.map