import { defineCommand } from "@bunli/core";
import { WalletAdapter } from "../wallet";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { createCommandOutput } from "../output";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";

export default defineCommand({
  name: "balances",
  description: "Fetch native and token balances for an account (no device required)",
  options: {
    account: accountOption,
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const ctx = { command: "balances", network: "", account: "" };
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
      const descriptor = await resolveAccountDescriptor(
        resolveAccountArg(flags.account, positional),
      );
      ctx.network = networkStringFromCurrencyId(descriptor.currencyId);
      ctx.account = descriptor.id;
      walletCliDebug(`balances: account=${descriptor.id}, output=${output}`);
      const wallet = new WalletAdapter();

      const balances = await out.withActivity(
        `Fetching balances for ${ctx.network}…`,
        "Balances fetched",
        () => wallet.getAccountBalances(descriptor),
      );
      await out.balances(balances);
    });
  },
});
