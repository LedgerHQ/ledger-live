/* eslint-disable no-console */
import { generateMnemonic } from "bip39";
import { from } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { bot } from "@ledgerhq/live-common/bot/index";
import { CurrencyCommonOpts, currencyOpt } from "../../scan";

export type BotJobOpts = CurrencyCommonOpts &
  Partial<{
    mutation: string;
    filter?: { currencies: string[] };
  }>;

export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [
    currencyOpt,
    {
      name: "mutation",
      alias: "m",
      type: String,
      desc: "filter the mutation to run by a regexp pattern",
    },
  ],
  job: (arg: BotJobOpts) => {
    const SEED = getEnv("SEED");

    if (!SEED) {
      console.log(
        "You have not defined a SEED yet. Please use a new one SPECIFICALLY to this test and with NOT TOO MUCH funds. USE THIS BOT TO YOUR OWN RISK!\n" +
          "here is a possible software seed you can use:\n" +
          "SEED='" +
          generateMnemonic(256) +
          "'",
      );
      throw new Error("Please define a SEED env variable to run this bot.");
    }

    if (arg.currency) {
      // Remapping to match arg format in libs/ledger-live-common/src/bot/cli.ts
      arg.filter = { currencies: [arg.currency] };
      delete arg.currency;
    }

    return from(bot(arg));
  },
};
