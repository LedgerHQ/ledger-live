import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createCommandOutput } from "../../output";
import { WalletAdapter } from "../../wallet";
import {
  trackEarnDepositCompleted,
  trackEarnDepositFailed,
  trackEarnDepositRejected,
  trackEarnDepositStarted,
} from "../../analytics/earn-analytics";
import { withTracking } from "../../analytics/tracking";
import { accountOption, deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";
import { resolveEarnCommand } from "./earn-command";

export default defineCommand({
  name: "deposit",
  description: "Deposit funds into an earn product (ETH vault) or stake (Solana)",
  options: {
    account: accountOption,
    product: option(z.string().min(1, "Product is required (--product <vault-id|validator>)"), {
      description: "ETH: vault id from `earn yields`. Solana: validator vote account address.",
      short: "p",
    }),
    amount: option(z.string().min(1, "Amount is required (--amount <value>)"), {
      description: "Amount to deposit, e.g. '100 USDC' (ETH) or '1.5 SOL' (Solana)",
    }),
    "dry-run": option(z.boolean().default(false), {
      description: "Prepare and validate but do not sign or broadcast",
      argumentKind: "flag",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const ctx = { command: "earn deposit", network: "", account: "" };
    const out = createCommandOutput(output, ctx);
    const wallet = new WalletAdapter();
    const dryRun = flags["dry-run"];

    await out.run(async () => {
      const { descriptor, network, family, adapter, device } = await resolveEarnCommand({
        action: "deposit",
        account: flags.account,
        positional,
        ctx,
        dryRun,
        deviceTimeoutMs: flags["device-timeout"],
      });

      const result = await withTracking(
        {
          onStart: () =>
            trackEarnDepositStarted({
              family,
              network,
              product: flags.product,
              amount: flags.amount,
              dryRun,
            }),
          onSuccess: r =>
            trackEarnDepositCompleted({
              family: r.family,
              network: r.network,
              amount: r.amount,
              status: r.status,
              transactionsCount: r.transactions.length,
            }),
          onRejected: () => trackEarnDepositRejected({ network }),
          onFailed: (_error, info) => trackEarnDepositFailed(info),
        },
        () =>
          adapter.deposit({
            descriptor,
            network,
            product: flags.product,
            amount: flags.amount,
            dryRun,
            wallet,
            out,
            device,
          }),
      );

      // Render outside the tracked work: a formatting error here must not emit a spurious
      // `earndeposit_failed` for a deposit that already broadcast and logged `earndeposit_completed`.
      out.earnDepositResult(result);
    });
  },
});
