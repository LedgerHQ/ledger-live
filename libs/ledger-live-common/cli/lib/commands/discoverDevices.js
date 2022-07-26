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
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var hw_1 = require("@ledgerhq/live-common/lib/hw");
exports["default"] = {
    args: [
        {
            name: "module",
            alias: "m",
            type: String,
            desc: "filter a specific module (either hid | ble)"
        },
        {
            name: "interactive",
            alias: "i",
            type: Boolean,
            desc: "interactive mode that accumulate the events instead of showing them"
        },
    ],
    job: function (_a) {
        var module = _a.module, interactive = _a.interactive;
        var events = (0, hw_1.discoverDevices)(function (m) {
            return !module ? true : module.split(",").includes(m.id);
        });
        if (!interactive)
            return events;
        return events
            .pipe((0, operators_1.scan)(function (acc, value) {
            var copy;
            if (value.type === "remove") {
                copy = acc.filter(function (a) { return a.id === value.id; });
            }
            else {
                var existing = acc.find(function (o) { return o.id === value.id; });
                if (existing) {
                    var i = acc.indexOf(existing);
                    copy = __spreadArray([], __read(acc), false);
                    if (value.name) {
                        copy[i] = value;
                    }
                }
                else {
                    copy = acc.concat({
                        id: value.id,
                        name: value.name
                    });
                }
            }
            return copy;
        }, []))
            .pipe((0, operators_1.tap)(function () {
            // eslint-disable-next-line no-console
            console.clear();
        }), (0, operators_1.map)(function (acc) {
            return acc
                .map(function (o) { return "".concat((o.name || "(no name)").padEnd(40), " ").concat(o.id); })
                .join("\n");
        }));
    }
};
//# sourceMappingURL=discoverDevices.js.map