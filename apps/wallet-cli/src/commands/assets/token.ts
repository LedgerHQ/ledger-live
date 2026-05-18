import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createCommandOutput } from "../../output";
import { walletCliDebug } from "../../shared/log";
import { toTokenInfo } from "../../wallet/models";
import { outputOption, resolveOutputFormat } from "../inputs";

export default defineCommand({
  name: "token",
  description:
    "Resolve a token by contract address on a given network (e.g. ethereum 0xdac17f95...). Prints the token id.",
  options: {
    output: outputOption,
    identifier: option(z.string().min(1).optional(), {
      description:
        "Optional token identifier for non-EVM chains (MultiversX ESDT, Cardano, Algorand, Stellar).",
      short: "i",
    }),
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const network = positional[0];
    const address = positional[1];

    const ctx = { command: "assets token", network: network ?? "" };
    const out = createCommandOutput(output, ctx);

    await out.run(async () => {
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
        flags.identifier,
      );
      if (!token) {
        throw new Error(
          `Token not found: network=${network}, address=${address}${flags.identifier ? `, identifier=${flags.identifier}` : ""}.`,
        );
      }
      out.token(toTokenInfo(token));
    });
  },
});
