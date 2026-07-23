import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { createCommandOutput } from "../../output";
import { parseNetworkArg, serializeNetwork } from "../../shared/accountDescriptor";
import { Session } from "../../session/session-store";
import { DEFAULT_STAKE_VALIDATORS_LIMIT, listEarnYieldRows } from "../../wallet/earn/yields";
import { outputOption, resolveOutputFormat } from "../inputs";
import { trackEarnYieldsRequested, trackEarnYieldsReturned } from "../../analytics/earn-analytics";

export default defineCommand({
  name: "yields",
  description: "List earn yield opportunities (no device required)",
  options: {
    network: option(z.string().min(1).optional(), {
      description:
        'Filter by network and enrich with provider details, e.g. "ethereum", "solana". No env = mainnet.',
      short: "n",
    }),
    limit: option(z.coerce.number().int().positive().default(DEFAULT_STAKE_VALIDATORS_LIMIT), {
      description: `Max number of deposit targets (validators / vaults) to list. Default: ${DEFAULT_STAKE_VALIDATORS_LIMIT}.`,
      short: "l",
    }),
    all: option(z.boolean().default(false), {
      description:
        "List all supported-network yields, ignoring the discovered-account filter (no effect with --network).",
      argumentKind: "flag",
    }),
    account: option(z.string().min(1).optional(), {
      description:
        "Session label whose account is embedded in the deposit deeplinks (default: first account per network).",
      short: "a",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const output = resolveOutputFormat(flags.output);
    const networkArg = flags.network;

    // Canonical `name:env` form (e.g. "ethereum" -> "ethereum:main"), so both the JSON envelope and
    // analytics match what deposit/withdraw/positions emit. Empty when listing all networks.
    const parsedNetwork = networkArg ? parseNetworkArg(networkArg) : undefined;
    const trackedNetwork = parsedNetwork ? serializeNetwork(parsedNetwork) : "";

    const out = createCommandOutput(output, {
      command: "earn yields",
      network: trackedNetwork,
    });

    await out.run(async () => {
      trackEarnYieldsRequested({ network: trackedNetwork });

      const session = await Session.read();
      const rows = await listEarnYieldRows({
        session,
        network: parsedNetwork,
        limit: flags.limit,
        all: flags.all,
        accountLabel: flags.account,
      });

      trackEarnYieldsReturned({ network: trackedNetwork, rowsCount: rows.length });
      out.earnYields(rows);
    });
  },
});
