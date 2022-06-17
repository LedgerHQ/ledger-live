"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
/* eslint-disable no-console */
var winston_1 = __importDefault(require("winston"));
var env_1 = require("@ledgerhq/live-common/lib/env");
var simple_1 = __importDefault(require("@ledgerhq/live-common/lib/logs/simple"));
var logs_1 = require("@ledgerhq/logs");
var currencies_1 = require("@ledgerhq/live-common/lib/currencies");
var version_1 = require("@ledgerhq/live-common/lib/platform/version");
(0, version_1.setPlatformVersion)("0.0.1");
(0, currencies_1.setSupportedCurrencies)([
    "bitcoin",
    "ethereum",
    "bsc",
    "polkadot",
    "ripple",
    "litecoin",
    "polygon",
    "bitcoin_cash",
    "stellar",
    "dogecoin",
    "cosmos",
    "dash",
    "tron",
    "tezos",
    "elrond",
    "ethereum_classic",
    "zcash",
    "decred",
    "digibyte",
    "algorand",
    "qtum",
    "bitcoin_gold",
    "komodo",
    "pivx",
    "zencash",
    "vertcoin",
    "peercoin",
    "viacoin",
    "stakenet",
    "bitcoin_testnet",
    "ethereum_ropsten",
    "ethereum_goerli",
    "cosmos_testnet",
    "crypto_org",
    "crypto_org_croeseid",
    "celo",
    "hedera",
]);
for (var k in process.env)
    (0, env_1.setEnvUnsafe)(k, process.env[k]);
var _a = process.env, VERBOSE = _a.VERBOSE, VERBOSE_FILE = _a.VERBOSE_FILE;
var logger = winston_1["default"].createLogger({
    level: "debug",
    transports: []
});
var format = winston_1["default"].format;
var combine = format.combine, json = format.json;
var winstonFormatJSON = json();
var winstonFormatConsole = combine(format(function (_a) {
    var _type = _a.type, _id = _a.id, _date = _a.date, rest = __rest(_a, ["type", "id", "date"]);
    return rest;
})(), format.colorize(), (0, simple_1["default"])());
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};
var level = VERBOSE && VERBOSE in levels ? VERBOSE : "debug";
if (VERBOSE_FILE) {
    logger.add(new winston_1["default"].transports.File({
        format: winstonFormatJSON,
        filename: VERBOSE_FILE,
        level: level
    }));
}
if (VERBOSE && VERBOSE !== "json") {
    logger.add(new winston_1["default"].transports.Console({
        format: winstonFormatConsole,
        // FIXME: this option is not recognzed by winston API
        // colorize: true,
        level: level
    }));
}
else {
    logger.add(new winston_1["default"].transports.Console({
        format: winstonFormatJSON,
        silent: !VERBOSE,
        level: level
    }));
}
(0, logs_1.listen)(function (log) {
    var type = log.type;
    var level = "info";
    if (type === "apdu" ||
        type === "hw" ||
        type === "speculos" ||
        type.includes("debug")) {
        level = "debug";
    }
    else if (type.includes("warn")) {
        level = "warn";
    }
    else if (type.startsWith("network") || type.startsWith("socket")) {
        level = "http";
    }
    else if (type.includes("error")) {
        level = "error";
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logger.log(level, log);
});
//# sourceMappingURL=live-common-setup-base.js.map