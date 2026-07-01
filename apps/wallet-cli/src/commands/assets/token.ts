import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { toTokenInfo } from "../../wallet/models";
import { outputOption, resolveOutputFormat } from "../inputs";

export const assetsTokenInputSchema = z.object({
  network: z.string().min(1, "Network is required"),
  address: z.string().min(1, "Token contract address is required"),
  identifier: z.string().min(1).optional(),
});

export type AssetsTokenInput = z.infer<typeof assetsTokenInputSchema>;

export function assetsTokenContext(input: AssetsTokenInput): OutputContext {
  return { command: "assets token", network: input.network ?? "" };
}

export async function assetsTokenCore(input: AssetsTokenInput, out: CommandOutput): Promise<void> {
  await out.run(async () => {
    const { network, address, identifier } = input;
    if (!network) {
      throw new Error(
        "Missing network. Usage: assets token <network> <address> — e.g. `assets token ethereum 0xdac17f95...`.",
      );
    }
    if (!address) {
      throw new Error(
        "Missing address. Usage: assets token <network> <address> — e.g. `assets token ethereum 0xdac17f95...`.",
      );
    }
    if (!findCryptoCurrencyById(network)) {
      throw new Error(
        `Unknown network "${network}". Pass a Ledger currency id like ethereum, polygon, bsc.`,
      );
    }

    walletCliDebug(`assets token: network=${network}, address=${address}`);
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      address,
      network,
      identifier,
    );
    if (!token) {
      const identifierDetail = identifier ? `, identifier=${identifier}` : "";
      throw new Error(
        `Token not found: network=${network}, address=${address}${identifierDetail}.`,
      );
    }
    out.token(toTokenInfo(token));
  });
}

export default defineCommand({
  name: "token",
  description:
    "Resolve a token by contract address on a given network (e.g. ethereum 0xdac17f95...). Prints the token id.",
  options: {
    output: outputOption,
    identifier: option(assetsTokenInputSchema.shape.identifier, {
      description:
        "Optional token identifier for non-EVM chains (MultiversX ESDT, Cardano, Algorand, Stellar).",
      short: "i",
    }),
  },
  handler: async ({ flags, positional }) => {
    const input: AssetsTokenInput = {
      // network/address are required in-schema (so MCP rejects a missing arg); "" fallback
      // routes an absent positional to the core's friendly "Missing …" guard. See balances.ts.
      network: positional[0] ?? "",
      address: positional[1] ?? "",
      identifier: flags.identifier,
    };
    const out = createCommandOutput(resolveOutputFormat(flags.output), assetsTokenContext(input));
    await assetsTokenCore(input, out);
  },
});
