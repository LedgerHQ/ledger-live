import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getSwapAPIBaseURL, getSwapUserIP } from "@ledgerhq/live-common/exchange/swap/index";
import { walletCliDebug } from "../../shared/log";
import { mapSwapStatusLine } from "./status-shared";
import type { SwapStatus } from "@ledgerhq/live-common/exchange/swap/types";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

type StatusFlags = {
  "swap-id": string;
  provider: string;
};

async function fetchSwapStatus(flags: StatusFlags): Promise<SwapStatus[]> {
  const baseURL = getSwapAPIBaseURL();
  const response = await fetch(`${baseURL}/swap/status`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
      ...(getSwapUserIP() ?? {}),
    },
    body: JSON.stringify([
      {
        provider: flags.provider,
        swapId: flags["swap-id"],
      },
    ]),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch swap status (HTTP ${response.status})`);
  }

  return await response.json();
}

export default defineCommand({
  name: "status",
  description: "Read current swap status from the partner API",
  options: {
    "swap-id": option(z.string().min(1, "Swap ID is required"), {
      description: "Swap identifier returned by the swap flow",
    }),
    provider: option(z.string().min(1, "Provider is required"), {
      description: "Partner identifier",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const output = resolveOutputFormat(flags.output);
    walletCliDebug(
      `swap status: swapId=${flags["swap-id"]} provider=${flags.provider} output=${output}`,
    );
    const out = createCommandOutput(output, { command: "swap status", network: "swap" });

    await out.run(async () => {
      const raw = await fetchSwapStatus({
        "swap-id": flags["swap-id"],
        provider: flags.provider,
      });
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error(
          `No swap status found for swap id "${flags["swap-id"]}"${flags.provider ? ` and provider "${flags.provider}"` : ""}.`,
        );
      }
      out.swapStatus(mapSwapStatusLine(raw[0], flags["swap-id"]));
    });
  },
});
