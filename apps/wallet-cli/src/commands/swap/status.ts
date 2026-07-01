import { defineCommand, option } from "@bunli/core";
import { getMultipleStatus } from "@ledgerhq/live-common/exchange/swap/getStatus";
import { z } from "zod";
import { walletCliDebug } from "../../shared/log";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";
import { outputOption, resolveOutputFormat } from "../inputs";
import { mapSwapStatusLine } from "./status-shared";
import { resolveSwapProvider } from "./providers";
import { swapFlowId, trackSwapStatusPolled } from "../../analytics/swap-analytics";

export const swapStatusInputSchema = z.object({
  "swap-id": z.string().min(1, "Swap ID is required"),
  provider: z.string().min(1, "Provider is required"),
});

export type SwapStatusInput = z.infer<typeof swapStatusInputSchema>;

export function swapStatusContext(_input: SwapStatusInput): OutputContext {
  return { command: "swap status", network: "swap" };
}

export async function swapStatusCore(input: SwapStatusInput, out: CommandOutput): Promise<void> {
  walletCliDebug(`swap status: swapId=${input["swap-id"]} provider=${input.provider}`);
  const provider = resolveSwapProvider(input.provider);
  const flowId = swapFlowId();
  await out.run(async () => {
    trackSwapStatusPolled({ flowId, swapId: input["swap-id"], provider });
    const raw = await getMultipleStatus([
      {
        provider,
        swapId: input["swap-id"],
      },
    ]);
    if (!Array.isArray(raw) || raw.length === 0) {
      const providerDetail = input.provider ? ` and provider "${input.provider}"` : "";
      throw new Error(`No swap status found for swap id "${input["swap-id"]}"${providerDetail}.`);
    }
    out.swapStatus(mapSwapStatusLine(raw[0], input["swap-id"]));
  });
}

export default defineCommand({
  name: "status",
  description: "Read current swap status from the partner API",
  options: {
    "swap-id": option(swapStatusInputSchema.shape["swap-id"], {
      description: "Swap identifier returned by the swap flow",
    }),
    provider: option(swapStatusInputSchema.shape.provider, {
      description: "Partner identifier",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const input: SwapStatusInput = {
      "swap-id": flags["swap-id"],
      provider: flags.provider,
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), swapStatusContext(input));
    await swapStatusCore(input, out);
  },
});
