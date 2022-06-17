"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var invariant_1 = __importDefault(require("invariant"));
var operators_1 = require("rxjs/operators");
var bridge_1 = require("@ledgerhq/live-common/lib/bridge");
var accounts_1 = require("@ledgerhq/live-common/lib/migrations/accounts");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var version_1 = require("@ledgerhq/live-common/lib/platform/version");
var test_dataset_1 = __importDefault(require("@ledgerhq/live-common/lib/generated/test-dataset"));
var live_common_setup_1 = require("../live-common-setup");
(0, version_1.setPlatformVersion)("0.0.1");
var defaultSyncConfig = {
    paginationConfig: {},
    blacklistedTokenIds: ["ethereum/erc20/ampleforth", "ethereum/erc20/steth"]
};
var excluded = [
    "algorand",
    "bitcoin",
    "bitcoin_cash",
    "bitcoin_gold",
    "cosmos",
    "dash",
    "decred",
    "digibyte",
    "dogecoin",
    "ethereum_classic",
    "komodo",
    "litecoin",
    "peercoin",
    "pivx",
    "polkadot",
    "qtum",
    "ripple",
    "stakenet",
    "stellar",
    "stealthcoin",
    "viacoin",
    "vertcoin",
    "zcash",
    "zencash",
];
var appJsonTemplate = {
    data: {
        SPECTRON_RUN: {
            localStorage: {
                acceptedTermsVersion: "2019-12-04"
            }
        },
        settings: {
            hasCompletedOnboarding: true,
            counterValue: "USD",
            language: "en",
            theme: "light",
            region: null,
            orderAccounts: "balance|desc",
            countervalueFirst: false,
            autoLockTimeout: 10,
            selectedTimeRange: "month",
            marketIndicator: "western",
            currenciesSettings: {},
            pairExchanges: {},
            developerMode: false,
            loaded: true,
            shareAnalytics: true,
            sentryLogs: true,
            lastUsedVersion: "99.99.99",
            dismissedBanners: [],
            accountsViewMode: "list",
            showAccountsHelperBanner: true,
            hideEmptyTokenAccounts: false,
            sidebarCollapsed: false,
            discreetMode: false,
            preferredDeviceModel: "nanoS",
            hasInstalledApps: true,
            carouselVisibility: 99999999999,
            hasAcceptedSwapKYC: false,
            lastSeenDevice: null,
            blacklistedTokenIds: [],
            swapAcceptedProviderIds: [],
            deepLinkUrl: null,
            firstTimeLend: false,
            swapProviders: [],
            showClearCacheBanner: false,
            starredAccountIds: [],
            hasPassword: false
        },
        user: {
            id: "08cf3393-c5eb-4ea7-92de-0deea22e3971"
        },
        countervalues: {},
        accounts: []
    }
};
var extraCurrenciesData = function () {
    var data = [];
    Object.keys(test_dataset_1["default"]).forEach(function (key) {
        var currencies = test_dataset_1["default"][key].currencies;
        Object.keys(currencies).forEach(function (k) {
            var _a, _b;
            // TODO: Check why these are not working
            if (excluded.includes(k)) {
                return;
            }
            var currency = currencies[k];
            if (!((_a = currency.scanAccounts) === null || _a === void 0 ? void 0 : _a.length))
                return;
            (_b = currency.scanAccounts) === null || _b === void 0 ? void 0 : _b.forEach(function (sa) {
                data.push({
                    currencyName: k,
                    apdus: sa.apdus
                });
            });
        });
    });
    return data;
};
var syncAccount = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var currency, bridge, deviceId, accounts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                currency = (0, currencies_1.getCryptoCurrencyById)(data.currencyName);
                bridge = (0, bridge_1.getCurrencyBridge)(currency);
                return [4 /*yield*/, (0, live_common_setup_1.mockDeviceWithAPDUs)(data.apdus)];
            case 1:
                deviceId = _a.sent();
                (0, invariant_1["default"])(currency, "could not find currency for ".concat(data.currencyName));
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                return [4 /*yield*/, bridge
                        .scanAccounts({
                        currency: currency,
                        deviceId: deviceId,
                        syncConfig: defaultSyncConfig
                    })
                        .pipe((0, operators_1.filter)(function (e) { return e.type === "discovered"; }), (0, operators_1.map)(function (e) { return e.account; }), (0, operators_1.reduce)(function (all, a) { return all.concat(a); }, []))
                        .toPromise()];
            case 3:
                accounts = _a.sent();
                return [2 /*return*/, (0, accounts_1.implicitMigration)(accounts)];
            case 4:
                (0, live_common_setup_1.releaseMockDevice)(deviceId);
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var data, accounts, flatten;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = extraCurrenciesData();
                    return [4 /*yield*/, Promise.all(data.flatMap(function (d) { return syncAccount(d); }))];
                case 1:
                    accounts = _a.sent();
                    flatten = accounts.flat();
                    appJsonTemplate.data.accounts = flatten;
                    console.log(JSON.stringify(appJsonTemplate));
                    return [2 /*return*/];
            }
        });
    });
}
exports["default"] = {
    description: "Extract accounts from test datasets and print a sample app.json usable for tests",
    args: [],
    job: function () { return main(); }
};
//# sourceMappingURL=generateAppJsonFromDataset.js.map