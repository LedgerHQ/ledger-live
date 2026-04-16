import { defineCommand } from "@bunli/core";
import { WalletAdapter } from "../wallet";
import { parseAccountDescriptor, resolveAccountArg } from "../wallet/models";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { createCommandOutput } from "../output";
import { accountOption, outputOption } from "./shared-options";

export default defineCommand({
  name: "balances",
  description: "Fetch native and token balances for an account descriptor (no device required)",
  options: {
    account: accountOption,
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const descriptor = parseAccountDescriptor(resolveAccountArg(flags.account, positional));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    walletCliDebug(`balances: account=${descriptor.id}, output=${flags.output}`);
    const wallet = new WalletAdapter();
    const out = createCommandOutput(flags.output, { command: "balances", network, account: descriptor.id });

    await out.run(async () => {
      const balances = await out.withActivity(
        `Fetching balances for ${network}…`,
        "Balances fetched",
        () => wallet.getAccountBalances(descriptor),
      );
      await out.balances(balances);
    });
  },
});
