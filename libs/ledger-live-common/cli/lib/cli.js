"use strict";
/* eslint-disable no-console */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var e_1, _a;
exports.__esModule = true;
var errors_1 = require("@ledgerhq/errors");
var rxjs_1 = require("rxjs");
var command_line_args_1 = __importDefault(require("command-line-args"));
var live_common_setup_1 = require("./live-common-setup");
var commands_index_1 = __importDefault(require("./commands-index"));
// TODO cli-transaction.js => cli.js
var cli_transaction_1 = __importDefault(require("@ledgerhq/live-common/lib/generated/cli-transaction"));
var commands = __assign(__assign({}, Object.values(cli_transaction_1["default"])
    .map(function (m) { return typeof m === "object" && m && m.commands; })
    .reduce(function (acc, c) { return (__assign(__assign({}, acc), c)); }, {})), commands_index_1["default"]);
var mainOptions = (0, command_line_args_1["default"])([
    { name: "command", defaultOption: true },
    { name: "help", alias: "h", type: Boolean },
], {
    stopAtFirstUnknown: true
});
if (mainOptions.help || !mainOptions.command) {
    console.log("Ledger Live @ https://github.com/LedgerHQ/ledger-live-common");
    console.log("");
    console.log("Usage: ledger-live <command> ...");
    console.log("");
    for (var k in commands) {
        var cmd_1 = commands[k];
        console.log("Usage: ledger-live ".concat(k, " ").padEnd(30) +
            (cmd_1.description ? "# ".concat(cmd_1.description) : ""));
        try {
            for (var _b = (e_1 = void 0, __values(cmd_1.args)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var opt = _c.value;
                var str = opt.alias ? " -".concat(opt.alias, ", ") : "     ";
                str += "--".concat(opt.name);
                if ((opt.type && opt.type !== Boolean) || opt.typeDesc) {
                    str += " <".concat(opt.typeDesc || opt.type.name, ">");
                }
                if (opt.desc) {
                    str = str.padEnd(30) + ": ".concat(opt.desc);
                }
                console.log(str);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log("");
    }
    console.log("");
    console.log("                ````                    ");
    console.log("           `.--:::::                    ");
    console.log("        `.-:::::::::       ````         ");
    console.log("       .://///:-..``     `-/+++/-`      ");
    console.log("     `://///-`           -++++++o/.     ");
    console.log("    `/+++/:`            -+++++osss+`    ");
    console.log("   `:++++:`            ./++++-/osss/`   ");
    console.log("   .+++++`             `-://- .ooooo.   ");
    console.log("   -+ooo/`                ``  `/oooo-   ");
    console.log("   .oooo+` .::-.`             `+++++.   ");
    console.log("   `+oooo:./+++/.             -++++/`   ");
    console.log("    -ossso+++++:`            -/+++/.    ");
    console.log("     -ooo+++++:`           .://///.     ");
    console.log("      ./+++++/`       ``.-://///:`      ");
    console.log("        `---.`      -:::::///:-.        ");
    console.log("                    :::::::-.`          ");
    console.log("                    ....``              ");
    console.log("");
    console.log("Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.");
    process.exit(0);
}
var cmd = commands[mainOptions.command];
if (!cmd) {
    console.error("Command not found: ledger-live " + mainOptions.command);
    process.exit(1);
}
var argv = mainOptions._unknown || [];
var options = (0, command_line_args_1["default"])(cmd.args, { argv: argv, stopAtFirstUnknown: true });
(0, rxjs_1.from)(cmd.job(options)).subscribe({
    next: function (log) {
        if (log !== undefined)
            console.log(log);
    },
    error: function (error) {
        var e = error instanceof Error ? error : (0, errors_1.deserializeError)(error);
        if (process.env.VERBOSE || process.env.VERBOSE_FILE)
            console.error(e);
        else
            console.error(String(e.message || e));
        process.exit(1);
    },
    complete: function () {
        (0, live_common_setup_1.closeAllDevices)();
    }
});
var sigIntSent;
process.on("SIGINT", function () {
    if (!sigIntSent) {
        sigIntSent = Date.now();
        (0, live_common_setup_1.closeAllDevices)();
    }
    else {
        if (Date.now() - sigIntSent > 3000) {
            console.error("was not able to terminate gracefully. exiting");
            process.exit(1);
        }
    }
});
//# sourceMappingURL=cli.js.map