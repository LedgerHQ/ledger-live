import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getSwapAPIBaseURL, getSwapUserIP } from "@ledgerhq/live-common/exchange/swap/index";
import network from "@ledgerhq/live-network";
import { writeStdout } from "../../shared/ui";
import { walletCliDebug } from "../../shared/log";
import { formatSwapStatusHuman, mapSwapStatusLine } from "./status-shared";
import { SwapStatus } from "@ledgerhq/live-common/lib-es/exchange/swap/types";

type StatusFormat = "human" | "json";

type StatusFlags = {
  "swap-id": string;
  provider?: string;
  format: StatusFormat;
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
    format: option(z.enum(["human", "json"]).default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags }) => {
    walletCliDebug(`swap status: swapId=${flags["swap-id"]} provider=${flags.provider ?? "auto"}`);
    const raw = await fetchSwapStatus({
      "swap-id": flags["swap-id"],
      provider: flags.provider,
      format: flags.format,
    });
    const statusLine = mapSwapStatusLine(raw[0], flags["swap-id"]);

    if (flags.format === "json") {
      writeStdout(JSON.stringify(statusLine, null, 2));
      return;
    }

    writeStdout(formatSwapStatusHuman(statusLine));
  },
});
