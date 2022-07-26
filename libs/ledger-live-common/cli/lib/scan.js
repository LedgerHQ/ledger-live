"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.scan = exports.inferCurrency = exports.inferManagerApp = exports.scanCommonOpts = exports.currencyOpt = exports.deviceOpt = void 0;
var bignumber_js_1 = require("bignumber.js");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var account_1 = require("@ledgerhq/live-common/lib/account");
var derivation_1 = require("@ledgerhq/live-common/lib/derivation");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var derivation_2 = require("@ledgerhq/live-common/lib/derivation");
var cache_1 = require("@ledgerhq/live-common/lib/bridge/cache");
var getAppAndVersion_1 = __importDefault(require("@ledgerhq/live-common/lib/hw/getAppAndVersion"));
var deviceAccess_1 = require("@ledgerhq/live-common/lib/hw/deviceAccess");
var promise_1 = require("@ledgerhq/live-common/lib/promise");
var stream_1 = require("./stream");
var helpers_1 = require("@ledgerhq/live-common/lib/account/helpers");
var fs_1 = __importDefault(require("fs"));
exports.deviceOpt = {
    name: "device",
    alias: "d",
    type: String,
    descOpt: "usb path",
    desc: "provide a specific HID path of a device"
};
exports.currencyOpt = {
    name: "currency",
    alias: "c",
    type: String,
    desc: "Currency name or ticker. If not provided, it will be inferred from the device."
};
var localCache = {};
var cache = (0, cache_1.makeBridgeCacheSystem)({
    saveData: function (c, d) {
        localCache[c.id] = d;
        return Promise.resolve();
    },
    getData: function (c) {
        return Promise.resolve(localCache[c.id]);
    }
});
exports.scanCommonOpts = [
    exports.deviceOpt,
    {
        name: "xpub",
        type: String,
        desc: "use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]",
        multiple: true
    },
    {
        name: "id",
        type: String,
        desc: "restore an account id (or a partial version of an id) (alternatively to --device)",
        multiple: true
    },
    {
        name: "file",
        type: String,
        typeDesc: "filename",
        desc: "use a JSON account file or '-' for stdin (alternatively to --device)"
    },
    {
        name: "appjsonFile",
        type: String,
        typeDesc: "filename",
        desc: "use a desktop app.json (alternatively to --device)"
    },
    exports.currencyOpt,
    {
        name: "scheme",
        alias: "s",
        type: String,
        desc: "if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme."
    },
    {
        name: "index",
        alias: "i",
        type: Number,
        desc: "select the account by index"
    },
    {
        name: "length",
        alias: "l",
        type: Number,
        desc: "set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise."
    },
    {
        name: "paginateOperations",
        type: Number,
        desc: "if defined, will paginate operations"
    },
];
var inferManagerApp = function (keyword) {
    try {
        var currency = (0, currencies_1.findCryptoCurrencyByKeyword)(keyword);
        if (!currency || !currency.managerAppName)
            return keyword;
        return currency.managerAppName;
    }
    catch (e) {
        return keyword;
    }
};
exports.inferManagerApp = inferManagerApp;
var implTypePerFamily = {
    tron: "js",
    ripple: "js",
    ethereum: "js",
    polkadot: "js",
    bitcoin: "js"
};
var possibleImpls = {
    js: 1,
    mock: 1
};
var inferCurrency = function (_a) {
    var device = _a.device, currency = _a.currency, file = _a.file, xpub = _a.xpub, id = _a.id;
    if (currency) {
        return (0, rxjs_1.defer)(function () { return (0, rxjs_1.of)((0, currencies_1.findCryptoCurrencyByKeyword)(currency)); });
    }
    if (file || xpub || id) {
        return (0, rxjs_1.of)(undefined);
    }
    return (0, deviceAccess_1.withDevice)(device || "")(function (t) {
        return (0, rxjs_1.from)((0, getAppAndVersion_1["default"])(t)
            .then(function (r) { return (0, currencies_1.findCryptoCurrencyByKeyword)(r.name); }, function () { return undefined; })
            .then(function (r) { return (0, promise_1.delay)(500).then(function () { return r; }); }));
    });
};
exports.inferCurrency = inferCurrency;
function requiredCurrency(cur) {
    if (!cur)
        throw new Error("--currency is required");
    return cur;
}
var prepareCurrency = function (fn) { return function (observable) {
    return observable.pipe((0, operators_1.concatMap)(function (item) {
        var maybeCurrency = fn(item);
        return maybeCurrency
            ? (0, rxjs_1.from)(cache.prepareCurrency(maybeCurrency).then(function () { return item; }))
            : (0, rxjs_1.of)(item);
    }));
}; };
function scan(arg) {
    var device = arg.device, idArray = arg.id, xpubArray = arg.xpub, file = arg.file, appjsonFile = arg.appjsonFile, scheme = arg.scheme, index = arg.index, length = arg.length, paginateOperations = arg.paginateOperations;
    var syncConfig = {
        paginationConfig: {
            operations: undefined
        }
    };
    if (typeof paginateOperations === "number") {
        syncConfig.paginationConfig.operations = paginateOperations;
    }
    if (typeof appjsonFile === "string") {
        var appjsondata = appjsonFile
            ? JSON.parse(fs_1["default"].readFileSync(appjsonFile, "utf-8"))
            : {
                data: {
                    accounts: []
                }
            };
        if (typeof appjsondata.data.accounts === "string") {
            return (0, rxjs_1.throwError)(new Error("encrypted ledger live data is not supported"));
        }
        return (0, rxjs_1.from)(appjsondata.data.accounts.map(function (a) { return (0, account_1.fromAccountRaw)(a.data); })).pipe((0, operators_1.skip)(index || 0), (0, operators_1.take)(length === undefined ? (index !== undefined ? 1 : Infinity) : length));
    }
    if (typeof file === "string") {
        return (0, stream_1.jsonFromFile)(file).pipe((0, operators_1.map)(account_1.fromAccountRaw), prepareCurrency(function (a) { return a.currency; }), (0, operators_1.concatMap)(function (account) {
            return (0, bridge_1.getAccountBridge)(account, null)
                .sync(account, syncConfig)
                .pipe((0, operators_1.reduce)(function (a, f) { return f(a); }, account));
        }));
    }
    return (0, exports.inferCurrency)(arg).pipe((0, operators_1.mergeMap)(function (cur) {
        var ids = idArray;
        if (xpubArray) {
            console.warn("Usage of --xpub is deprecated. Prefer usage of `--id`");
            ids = (ids || []).concat(xpubArray);
        }
        // TODO this should be a "inferAccountId" that needs to look at available impl and do same logic as in bridge.. + we should accept full id as param
        // we kill the --xpub to something else too (--id)
        // Restore from ids
        if (ids) {
            // Infer the full ids
            var fullIds = ids.map(function (id) {
                var _a, _b;
                try {
                    // preserve if decodeAccountId don't fail
                    (0, account_1.decodeAccountId)(id);
                    return id;
                }
                catch (e) {
                    var splitted_1 = id.split(":");
                    var findAndEat = function (predicate) {
                        var res = splitted_1.find(predicate);
                        if (typeof res === "string") {
                            splitted_1.splice(splitted_1.indexOf(res), 1);
                            return res;
                        }
                    };
                    var currencyId = findAndEat(function (s) { return (0, currencies_1.findCryptoCurrencyById)(s); }) ||
                        requiredCurrency(cur).id;
                    var currency_1 = (0, currencies_1.getCryptoCurrencyById)(currencyId);
                    var type = findAndEat(function (s) { return possibleImpls[s]; }) ||
                        implTypePerFamily[currency_1.family] ||
                        "js";
                    var version = findAndEat(function (s) { return s.match(/^\d+$/); }) || "1";
                    var derivationMode = (0, derivation_1.asDerivationMode)((_b = (_a = findAndEat(function (s) {
                        try {
                            return (0, derivation_1.asDerivationMode)(s);
                        }
                        catch (e) {
                            // this is therefore not a derivation mode
                        }
                    })) !== null && _a !== void 0 ? _a : scheme) !== null && _b !== void 0 ? _b : "");
                    if (splitted_1.length === 0) {
                        throw new Error("invalid id='" + id + "': missing xpub or address part");
                    }
                    if (splitted_1.length > 1) {
                        throw new Error("invalid id='" +
                            id +
                            "': couldn't understand which of these are the xpub or address part: " +
                            splitted_1.join(" | "));
                    }
                    var xpubOrAddress = splitted_1[0];
                    return (0, account_1.encodeAccountId)({
                        type: type,
                        version: version,
                        currencyId: currencyId,
                        xpubOrAddress: xpubOrAddress,
                        derivationMode: derivationMode
                    });
                }
            });
            return (0, rxjs_1.from)(fullIds.map(function (id) {
                var _a = (0, account_1.decodeAccountId)(id), derivationMode = _a.derivationMode, xpubOrAddress = _a.xpubOrAddress, currencyId = _a.currencyId;
                var currency = (0, currencies_1.getCryptoCurrencyById)(currencyId);
                var scheme = (0, derivation_2.getDerivationScheme)({
                    derivationMode: derivationMode,
                    currency: currency
                });
                var index = 0;
                var freshAddressPath = (0, derivation_2.runDerivationScheme)(scheme, currency, {
                    account: index,
                    node: 0,
                    address: 0
                });
                var account = {
                    type: "Account",
                    name: currency.name +
                        " " +
                        (derivationMode || "legacy") +
                        " " +
                        (0, helpers_1.shortAddressPreview)(xpubOrAddress),
                    xpub: xpubOrAddress,
                    seedIdentifier: xpubOrAddress,
                    starred: true,
                    used: true,
                    swapHistory: [],
                    id: id,
                    derivationMode: derivationMode,
                    currency: currency,
                    unit: currency.units[0],
                    index: index,
                    freshAddress: xpubOrAddress,
                    freshAddressPath: freshAddressPath,
                    freshAddresses: [],
                    creationDate: new Date(),
                    lastSyncDate: new Date(0),
                    blockHeight: 0,
                    balance: new bignumber_js_1.BigNumber(0),
                    spendableBalance: new bignumber_js_1.BigNumber(0),
                    operationsCount: 0,
                    operations: [],
                    pendingOperations: [],
                    balanceHistoryCache: account_1.emptyHistoryCache
                };
                return account;
            })).pipe(prepareCurrency(function (a) { return a.currency; }), (0, operators_1.concatMap)(function (account) {
                return (0, bridge_1.getAccountBridge)(account, null)
                    .sync(account, syncConfig)
                    .pipe((0, operators_1.reduce)(function (a, f) { return f(a); }, account));
            }));
        }
        var currency = requiredCurrency(cur);
        // otherwise we just scan for accounts
        return (0, rxjs_1.concat)((0, rxjs_1.of)(currency).pipe(prepareCurrency(function (a) { return a; })), (0, bridge_1.getCurrencyBridge)(currency).scanAccounts({
            currency: currency,
            deviceId: device || "",
            scheme: scheme && (0, derivation_1.asDerivationMode)(scheme),
            syncConfig: syncConfig
        })).pipe((0, operators_1.filter)(function (e) { return e.type === "discovered"; }), (0, operators_1.map)(function (e) { return e.account; }));
    }), (0, operators_1.skip)(index || 0), (0, operators_1.take)(length === undefined ? (index !== undefined ? 1 : Infinity) : length));
}
exports.scan = scan;
//# sourceMappingURL=scan.js.map