import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createCommandOutput } from "../../output";
import { WalletAdapter } from "../../wallet";
import {
  trackEarnWithdrawCompleted,
  trackEarnWithdrawFailed,
  trackEarnWithdrawRejected,
  trackEarnWithdrawStarted,
} from "../../analytics/earn-analytics";
import { withTracking } from "../../analytics/tracking";
import { accountOption, deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";
import { resolveEarnCommand } from "./earn-command";

export default defineCommand({
  name: "withdraw",
  description: "Withdraw from an earn product (ETH vault) or unstake (Solana)",
  options: {
    account: accountOption,
    product: option(z.string().min(1).optional(), {
      description: "ETH vault id to redeem from (required for EVM accounts).",
      short: "p",
    }),
    "stake-account": option(z.string().min(1).optional(), {
      description: "Solana stake account address to undelegate / withdraw from.",
    }),
    amount: option(z.string().min(1).optional(), {
      description:
        "EVM vaults only: amount to withdraw; omit to withdraw the full balance. " +
        "Rejected for Solana — unstaking always affects the entire stake account.",
    }),
    finalize: option(z.boolean().default(false), {
      description:
        "Solana unstaking is two-phase: run once to undelegate (deactivate) the stake account, " +
        "wait for the deactivation epoch boundary (~2-3 days), then re-run with --finalize to " +
        "withdraw (stake.withdraw) the inactive lamports back to your main account.",
      argumentKind: "flag",
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
    const ctx = { command: "earn withdraw", network: "", account: "" };
    const out = createCommandOutput(output, ctx);
    const wallet = new WalletAdapter();
    const dryRun = flags["dry-run"];

    await out.run(async () => {
      const { descriptor, network, family, adapter, device } = await resolveEarnCommand({
        action: "withdraw",
        account: flags.account,
        positional,
        ctx,
        dryRun,
        deviceTimeoutMs: flags["device-timeout"],
      });

      const result = await withTracking(
        {
          onStart: () =>
            trackEarnWithdrawStarted({
              family,
              network,
              product: flags.product,
              hasStakeAccount: Boolean(flags["stake-account"]),
              amount: flags.amount,
              finalize: flags.finalize,
              dryRun,
            }),
          onSuccess: r =>
            trackEarnWithdrawCompleted({
              family: r.family,
              network: r.network,
              status: r.status,
              transactionsCount: r.transactions.length,
            }),
          onRejected: () => trackEarnWithdrawRejected({ network }),
          onFailed: (_error, info) => trackEarnWithdrawFailed(info),
        },
        () =>
          adapter.withdraw({
            descriptor,
            network,
            product: flags.product,
            stakeAccount: flags["stake-account"],
            amount: flags.amount,
            finalize: flags.finalize,
            dryRun,
            wallet,
            out,
            device,
          }),
      );

      // Render outside the tracked work: a formatting error here must not emit a spurious
      // `earnwithdraw_failed` for a withdrawal that already broadcast and logged the completion.
      out.earnWithdrawResult(result);
    });
  },
});
