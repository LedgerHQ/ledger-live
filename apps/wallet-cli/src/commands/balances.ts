import { defineCommand } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../wallet";
import { networkStringFromCurrencyId } from "../shared/accountDescriptor";
import { walletCliDebug } from "../shared/log";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../output";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveOutputFormat,
} from "./inputs";
import { trackBalanceViewed } from "./accounts-analytics";

export const balancesInputSchema = z.object({
  account: z.string().min(1, "Account session label is required"),
});

export type BalancesInput = z.infer<typeof balancesInputSchema>;

export function balancesContext(_input: BalancesInput): OutputContext {
  return { command: "balances", network: "", account: "" };
}

export async function balancesCore(input: BalancesInput, out: CommandOutput): Promise<void> {
  await out.run(async () => {
    const descriptor = await resolveAccountDescriptor(resolveAccountArg(input.account, []));
    const network = networkStringFromCurrencyId(descriptor.currencyId);
    out.setContext({ network, account: descriptor.id });
    walletCliDebug(`balances: account=${descriptor.id}`);
    const wallet = new WalletAdapter();

    const balances = await out.withActivity(
      `Fetching balances for ${network}…`,
      "Balances fetched",
      () => wallet.getAccountBalances(descriptor),
    );
    trackBalanceViewed({ network });
    await out.balances(balances);
  });
}

export default defineCommand({
  name: "balances",
  description: "Fetch native and token balances for an account (no device required)",
  options: {
    account: accountOption,
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    // `account` is required in the schema so MCP advertises it and rejects a missing arg as
    // invalid_arguments. On the CLI it's an optional flag / first positional; an absent value
    // falls back to "" so the core's resolveAccountArg guard emits the friendly missing-account
    // error (and JSON envelope) rather than throwing raw out of the handler.
    const input: BalancesInput = { account: flags.account ?? positional[0] ?? "" };
    const out = createCommandOutput(resolveOutputFormat(flags.output), balancesContext(input));
    await balancesCore(input, out);
  },
});
