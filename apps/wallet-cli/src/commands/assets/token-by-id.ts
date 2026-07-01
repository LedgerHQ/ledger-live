import { defineCommand } from "@bunli/core";
import { z } from "zod";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { toTokenInfo } from "../../wallet/models";
import { outputOption, resolveOutputFormat } from "../inputs";

export const assetsTokenByIdInputSchema = z.object({
  id: z.string().min(1, "Token id is required"),
});

export type AssetsTokenByIdInput = z.infer<typeof assetsTokenByIdInputSchema>;

export function assetsTokenByIdContext(_input: AssetsTokenByIdInput): OutputContext {
  return { command: "assets token-by-id", network: "" };
}

export async function assetsTokenByIdCore(
  input: AssetsTokenByIdInput,
  out: CommandOutput,
): Promise<void> {
  await out.run(async () => {
    const { id } = input;
    if (!id) {
      throw new Error(
        "Missing token id. Usage: assets token-by-id <id> — e.g. `assets token-by-id ethereum/erc20/usd_tether__erc20_`.",
      );
    }

    walletCliDebug(`assets token-by-id: id=${id}`);
    const token = await getCryptoAssetsStore().findTokenById(id);
    if (!token) {
      throw new Error(`Token not found: id=${id}.`);
    }
    out.setContext({ network: token.parentCurrencyId });
    out.token(toTokenInfo(token));
  });
}

export default defineCommand({
  name: "token-by-id",
  description:
    "Resolve a token by id (e.g. ethereum/erc20/usd_tether__erc20_). Prints the full token details.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    // `id` is required in-schema (so MCP rejects a missing arg); "" fallback routes an absent
    // positional to the core's friendly "Missing token id" guard. See balances.ts.
    const input: AssetsTokenByIdInput = { id: positional[0] ?? "" };
    const out = createCommandOutput(
      resolveOutputFormat(flags.output),
      assetsTokenByIdContext(input),
    );
    await assetsTokenByIdCore(input, out);
  },
});
