import { defineCommand, option } from "@bunli/core";
import { getMultipleStatus } from "@ledgerhq/live-common/exchange/swap/getStatus";
import { z } from "zod";
import { walletCliDebug } from "../../shared/log";
import { createCommandOutput } from "../../output";
import { outputOption, resolveOutputFormat } from "../inputs";
import { mapSwapStatusLine } from "./status-shared";
import { resolveSwapProvider } from "./providers";

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
    const provider = resolveSwapProvider(flags.provider);
    await out.run(async () => {
      const raw = await getMultipleStatus([
        {
          provider,
          swapId: flags["swap-id"],
        },
      ]);
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error(
          `No swap status found for swap id "${flags["swap-id"]}"${flags.provider ? ` and provider "${flags.provider}"` : ""}.`,
        );
      }
      out.swapStatus(mapSwapStatusLine(raw[0], flags["swap-id"]));
    });
  },
});
