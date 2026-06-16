import { defineCommand } from "@bunli/core";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { toTokenInfo } from "../../wallet/models";
import { outputOption, resolveOutputFormat } from "../inputs";

export default defineCommand({
  name: "token-by-id",
  description:
    "Resolve a token by id (e.g. ethereum/erc20/usd_tether__erc20_). Prints the full token details.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const id = positional[0];

    const ctx = { command: "assets token-by-id", network: "" };
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
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
      ctx.network = token.parentCurrencyId;
      out.token(toTokenInfo(token));
    });
  },
});
