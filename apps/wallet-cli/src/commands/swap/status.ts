import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getSwapAPIBaseURL, getSwapUserIP } from "@ledgerhq/live-common/exchange/swap/index";
import network from "@ledgerhq/live-network";
import { walletCliDebug } from "../../shared/log";
import { mapSwapStatusLine } from "./status-shared";
import { SwapStatus } from "@ledgerhq/live-common/lib-es/exchange/swap/types";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

type StatusFlags = {
  "swap-id": string;
  provider?: string;
};

async function fetchSwapStatus(flags: StatusFlags): Promise<SwapStatus[]> {
  const baseURL = getSwapAPIBaseURL();
  const response = await network({
    method: "POST",
    url: `${baseURL}/swap/status`,
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
      ...(getSwapUserIP() ?? {}),
    },
    data: [
      {
        provider: flags.provider,
        swapId: flags["swap-id"],
      },
    ],
  });
  return response.data as unknown as SwapStatus[];
}

export default defineCommand({
  name: "status",
  description: "Read current swap status from the partner API",
  options: {
    "swap-id": option(z.string().min(1, "Swap ID is required"), {
      description: "Swap identifier returned by the swap flow",
    }),
    provider: option(z.string().min(1).optional(), {
      description: "Optional partner identifier when the API requires it",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const output = resolveOutputFormat(flags.output);
    walletCliDebug(
      `swap status: swapId=${flags["swap-id"]} provider=${flags.provider ?? "auto"} output=${output}`,
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
