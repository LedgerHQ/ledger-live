import { defineCommand, option } from "@bunli/core";
import { getMultipleStatus } from "@ledgerhq/live-common/exchange/swap/getStatus";
import { z } from "zod";
import { walletCliDebug } from "../../shared/log";
import { createCommandOutput } from "../../output";
import { outputOption, resolveOutputFormat } from "../inputs";
import { SwapNotFoundForProviderError } from "../../errors";
import { isSwapKnownToProvider, mapSwapStatusLine } from "./status-shared";
import { resolveSwapProvider, WALLET_CLI_DEFAULT_SWAP_PROVIDERS } from "./providers";
import { swapFlowId, trackSwapStatusPolled } from "../../analytics/swap-analytics";

async function findProvidersOwningSwapId(
  swapId: string,
  excludedProvider: string,
): Promise<string[]> {
  const candidates = new Set(WALLET_CLI_DEFAULT_SWAP_PROVIDERS.map(resolveSwapProvider));
  candidates.delete(excludedProvider);
  try {
    const raw = await getMultipleStatus([...candidates].map(provider => ({ provider, swapId })));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(isSwapKnownToProvider)
      .map(s => s.provider)
      .sort((a, b) => a.localeCompare(b));
  } catch (e) {
    walletCliDebug(`swap status: provider lookup for swapId=${swapId} failed: ${String(e)}`);
    return [];
  }
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
    const provider = resolveSwapProvider(flags.provider);
    const flowId = swapFlowId();
    await out.run(async () => {
      trackSwapStatusPolled({ flowId, swapId: flags["swap-id"], provider });
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
      const statusLine = mapSwapStatusLine(raw[0], flags["swap-id"]);
      if (statusLine === undefined) {
        const matchingProviders = await findProvidersOwningSwapId(flags["swap-id"], provider);
        throw new SwapNotFoundForProviderError(flags["swap-id"], flags.provider, matchingProviders);
      }
      out.swapStatus(statusLine);
    });
  },
});
