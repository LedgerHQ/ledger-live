import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { WalletAdapter } from "../wallet";
import { HumanFormatter, JsonFormatter } from "../wallet/formatter";
import { parseAccountDescriptor, resolveAccountArg, OutputFormatSchema } from "../wallet/models";
import { walletCliDebug } from "../shared/log";
import { withSpinner, writeStdout } from "../shared/ui";
import { makeEnvelope, makeErrorEnvelope } from "../shared/response";

export default defineCommand({
  name: "balances",
  description: "Fetch native and token balances for an account descriptor (no device required)",
  options: {
    account: option(z.string().min(1).optional(), {
      description:
        "Short account descriptor (output of account discover), or pass as first positional arg",
      short: "a",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    walletCliDebug(`balances: account=${descriptor.id}, output=${flags.output}`);
    const wallet = new WalletAdapter();
    const isHuman = flags.output === "human";

    try {
      const balances = await withSpinner(
        `Fetching balances for ${descriptor.currencyId}…`,
        "Balances fetched",
        () => wallet.getAccountBalances(descriptor),
        isHuman,
      );

      const fmt = new HumanFormatter(setupCalClientStore());
      if (isHuman) {
        for (const b of balances) {
          writeStdout(await fmt.formatBalance(b));
        }
      } else {
        const jsonFmt = new JsonFormatter(fmt);
        writeStdout(
          JSON.stringify(
            makeEnvelope(
              "balances",
              descriptor.currencyId,
              { balances: await jsonFmt.balances(balances) },
              descriptor.id,
            ),
            null,
            2,
          ),
        );
      }
    } catch (e) {
      if (isHuman) throw e;
      writeStdout(
        JSON.stringify(
          makeErrorEnvelope("balances", HumanFormatter.formatError(e), descriptor.currencyId),
          null,
          2,
        ),
      );
      process.exit(1);
    }
  },
});
