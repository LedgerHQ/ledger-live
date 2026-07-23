import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createCommandOutput } from "../../output";
import { serializeNetwork } from "../../shared/accountDescriptor";
import { walletCliDebug } from "../../shared/log";
import { writeStderr } from "../../shared/ui";
import { WalletAdapter } from "../../wallet";
import { getStakesV3 } from "../../wallet/earn/api";
import type { BatchedView } from "../../wallet/earn/api.types";
import type { EarnSolanaStake } from "../../wallet/earn/types";
import {
  accountOption,
  outputOption,
  resolveAccountArg,
  resolveAccountDescriptor,
  resolveAccountDescriptorV1,
  resolveOutputFormat,
} from "../inputs";
import {
  trackEarnPositionsRequested,
  trackEarnPositionsReturned,
} from "../../analytics/earn-analytics";

export default defineCommand({
  name: "positions",
  description: "List earn positions for an account (no device required)",
  options: {
    account: accountOption,
    fresh: option(z.boolean().default(false), {
      description:
        "Flag stale/missing positions for a background refresh. The backend returns the current " +
        "snapshot now and refreshes asynchronously, so refreshed rows appear on a re-run, not in " +
        "this response. Watch the '(stale)' marker to know whether to re-run.",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const ctx = { command: "earn positions", network: "", account: "" };
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
      const v1 = await resolveAccountDescriptorV1(resolveAccountArg(flags.account, positional));
      if (v1.type !== "address") {
        throw new Error(
          "Earn positions are only supported for account-based networks (e.g. solana, ethereum).",
        );
      }
      const network = v1.network.name;
      const address = v1.address;
      // Canonical `name:env` form for analytics/output, so mainnet vs devnet stays distinguishable
      // and matches the network string deposit/withdraw emit. The bare `network` name below is only
      // for the backend request / on-chain branch, which key off the env-less name.
      const trackedNetwork = serializeNetwork(v1.network);
      ctx.network = trackedNetwork;
      ctx.account = address;

      trackEarnPositionsRequested({ network: trackedNetwork });

      const fresh = flags.fresh;
      // /v3/stakes = /v1/stakes (DB snapshot now + async provider refresh after the response) plus
      // `meta.is_stale`. We use v3 over v1 here precisely because a one-shot CLI cannot silently
      // refetch the way the live-app's react-query layer does, so surfacing staleness is the only
      // way to tell the user the snapshot is incomplete and a re-run will show refreshed rows.
      // (getStakes/v1 is kept in wallet/earn/api.ts as the bare-array fallback if we ever need it.)
      const { data: views, meta } = await getStakesV3([{ network, address, fresh }]);

      // Enrich Solana positions with on-chain stake accounts so undelegate/withdraw can target a
      // concrete `--stake-account`. This is the only place those addresses surface in the CLI. Done
      // best-effort: a chain-sync failure must not sink the backend snapshot we already have.
      let stakes: EarnSolanaStake[] | undefined;
      if (network === "solana") {
        try {
          const descriptor = await resolveAccountDescriptor(
            resolveAccountArg(flags.account, positional),
          );
          stakes = await new WalletAdapter().getSolanaStakes(descriptor);
        } catch (error) {
          walletCliDebug(`earn positions: stake-account enrichment failed: ${String(error)}`);
          writeStderr(
            "Warning: could not load on-chain Solana stake accounts (showing backend snapshot only)\n",
          );
        }
      }

      // Each backend view becomes a row carrying `isStale`. On-chain Solana stake accounts are
      // account-level (not per-view), so they are passed separately and rendered once by the output.
      const rows = views.map((data: BatchedView) => ({
        network,
        address,
        fresh,
        isStale: meta.is_stale,
        data,
      }));

      trackEarnPositionsReturned({ network: trackedNetwork, positionsCount: rows.length });
      await out.earnPositions(rows, stakes);
    });
  },
});
