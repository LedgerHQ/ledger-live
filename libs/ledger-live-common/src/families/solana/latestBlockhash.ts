import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";

/**
 * Reads the latest confirmed blockhash of the Solana RPC at `endpoint`, for the device to sign with
 * once the user has reviewed the transaction. undefined when the portfolio layer serves the
 * currency: that path reaches the network only through the portfolio (spec §0.1), which serves no
 * blockhash, so the device signs the crafted one.
 */
export function latestBlockhashReader(
  currencyId: string,
  endpoint: string,
): (() => Promise<string>) | undefined {
  if (isPortfolioEnabledFor(currencyId)) return undefined;
  return async () => (await getChainAPI({ endpoint }).getLatestBlockhash("confirmed")).blockhash;
}
