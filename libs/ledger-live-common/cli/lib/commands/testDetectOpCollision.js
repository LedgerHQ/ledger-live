"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var toPairs_1 = __importDefault(require("lodash/toPairs"));
var flatMap_1 = __importDefault(require("lodash/flatMap"));
var groupBy_1 = __importDefault(require("lodash/groupBy"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var scan_1 = require("../scan");
exports["default"] = {
    description: "Detect operation collisions",
    args: __spreadArray([], __read(scan_1.scanCommonOpts), false),
    job: function (opts) {
        return (0, scan_1.scan)(opts).pipe((0, operators_1.reduce)(function (all, a) { return all.concat(a); }, []), (0, operators_1.concatMap)(function (accounts) {
            var allOps = (0, flatMap_1["default"])((0, account_1.flattenAccounts)(accounts), function (a) { return a.operations; });
            var operationIdCollisions = (0, toPairs_1["default"])((0, groupBy_1["default"])(allOps, "id"))
                .filter(function (_a) {
                var _b = __read(_a, 2), _ = _b[0], coll = _b[1];
                return coll.length > 1;
            })
                .map(function (_a) {
                var _b = __read(_a, 2), _ = _b[0], coll = _b[1];
                return coll;
            });
            return (0, rxjs_1.from)(operationIdCollisions);
        }));
    }
};
//# sourceMappingURL=testDetectOpCollision.js.map