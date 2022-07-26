"use strict";
exports.__esModule = true;
/* eslint-disable no-console */
var bip39_1 = require("bip39");
var rxjs_1 = require("rxjs");
var env_1 = require("@ledgerhq/live-common/lib/env");
var bot_1 = require("@ledgerhq/live-common/lib/bot");
var scan_1 = require("../scan");
exports["default"] = {
    description: "Run a bot test engine with speculos that automatically create accounts and do transactions",
    args: [
        scan_1.currencyOpt,
        {
            name: "mutation",
            alias: "m",
            type: String,
            desc: "filter the mutation to run by a regexp pattern"
        },
    ],
    job: function (arg) {
        var SEED = (0, env_1.getEnv)("SEED");
        if (!SEED) {
            console.log("You have not defined a SEED yet. Please use a new one SPECIFICALLY to this test and with NOT TOO MUCH funds. USE THIS BOT TO YOUR OWN RISK!\n" +
                "here is a possible software seed you can use:\n" +
                "SEED='" +
                (0, bip39_1.generateMnemonic)(256) +
                "'");
            throw new Error("Please define a SEED env variable to run this bot.");
        }
        return (0, rxjs_1.from)((0, bot_1.bot)(arg));
    }
};
//# sourceMappingURL=bot.js.map