"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var getDeviceInfo_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getDeviceInfo"));
var apps_1 = require("@ledgerhq/live-common/lib/apps");
var hw_1 = require("@ledgerhq/live-common/lib/apps/hw");
var scan_1 = require("../scan");
var prettyActionPlan = function (ops) {
    return ops.map(function (op) { return (op.type === "install" ? "+" : "-") + op.name; }).join(", ");
};
exports["default"] = {
    description: "test script to install and uninstall all apps",
    args: [
        scan_1.deviceOpt,
        {
            name: "index",
            type: Number
        },
    ],
    job: function (_a) {
        var device = _a.device, index = _a.index;
        return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
            var exec = (0, hw_1.execWithTransport)(t);
            // $FlowFixMe
            return (0, rxjs_1.from)((0, getDeviceInfo_1["default"])(t)).pipe(
            // FIXME: mergeMap deprecated, using map inside pipe should do the work
            (0, operators_1.map)(function (deviceInfo) {
                return (0, hw_1.listApps)(t, deviceInfo).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), (0, operators_1.map)(function (e) { return e.result; }), (0, operators_1.mergeMap)(function (listAppsResult) {
                    return listAppsResult.appsListNames.slice(index || 0).reduce(function ($state, name) {
                        return $state.pipe((0, operators_1.mergeMap)(function (s) {
                            if (s.currentError) {
                                console.error("FAILED " +
                                    s.currentError.appOp.type +
                                    " " +
                                    s.currentError.appOp.name +
                                    ": " +
                                    String(s.currentError.error));
                            }
                            console.log("on device: " +
                                s.installed
                                    .map(function (i) {
                                    return i.name + (!i.updated ? " (outdated)" : "");
                                })
                                    .join(", "));
                            s = (0, apps_1.reducer)(s, {
                                type: "wipe"
                            });
                            console.log("wipe action plan = " +
                                prettyActionPlan((0, apps_1.getActionPlan)(s)));
                            return (0, apps_1.runAll)(s, exec);
                        }), (0, operators_1.mergeMap)(function (s) {
                            s = (0, apps_1.reducer)(s, {
                                type: "install",
                                name: name
                            });
                            console.log("install '" +
                                name +
                                "' action plan = " +
                                prettyActionPlan((0, apps_1.getActionPlan)(s)));
                            return (0, apps_1.runAll)(s, exec);
                        }), (0, operators_1.mergeMap)(function (state) {
                            return new rxjs_1.Observable(function (o) {
                                var sub;
                                var timeout = setTimeout(function () {
                                    sub = (0, hw_1.listApps)(t, deviceInfo).subscribe(o);
                                }, 4000);
                                return function () {
                                    clearTimeout(timeout);
                                    if (sub)
                                        sub.unsubscribe();
                                };
                            }).pipe((0, operators_1.filter)(function (e) { return e.type === "result"; }), (0, operators_1.map)(function (e) { return e.result; }), (0, operators_1.map)(function (results) {
                                var app = results.installed.find(function (a) { return a.name === name; });
                                if (!app) {
                                    throw new Error("after install " +
                                        name +
                                        ", app is not visible on listApps");
                                }
                                if (app && !app.updated) {
                                    throw new Error("after install " +
                                        name +
                                        ", app hash is not matching latest one. Got " +
                                        app.hash);
                                }
                                // continue with state
                                return state;
                            }));
                        }));
                    }, (0, rxjs_1.of)((0, apps_1.initState)(listAppsResult)));
                }));
            }, (0, operators_1.ignoreElements)()));
        });
    }
};
//# sourceMappingURL=appsUpdateTestAll.js.map