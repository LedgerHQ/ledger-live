import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import type { Block } from "@ledgerhq/wallet-btc/storage/types";
import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { walletBtcCurrencyById } from "../walletBtcCurrency";
import type { BitcoinCoinConfig } from "../api/config";

/**
 * Stateless network layer for the coin-bitcoin Alpaca surface.
 *
 * Wraps wallet-btc's `BitcoinLikeExplorer` (Ledger explorers v4). It holds NO cross-call state and
 * never touches wallet-btc's process-wide `getWallet()` singleton — a fresh explorer is built per
 * call from the currency (its default endpoint via `walletBtcCurrencyById`) and, when provided, an
 * explorer URI from the Alpaca config.
 */
export function getExplorer(currencyId: string, config?: BitcoinCoinConfig): BitcoinLikeExplorer {
  const cryptoCurrency = walletBtcCurrencyById(currencyId);
  const forcedExplorerURI = config?.explorer?.uri;
  // Omit the key entirely when there is no override (exactOptionalPropertyTypes).
  return new BitcoinLikeExplorer(
    forcedExplorerURI ? { cryptoCurrency, forcedExplorerURI } : { cryptoCurrency },
  );
}

/** Latest confirmed block, or `null` if the explorer has none. */
export function getCurrentBlock(
  currencyId: string,
  config?: BitcoinCoinConfig,
): Promise<Block | null> {
  return getExplorer(currencyId, config).getCurrentBlock();
}

/** Fee-rate estimates keyed by confirmation target (sat/vB), as returned by the explorer. */
export function getFees(
  currencyId: string,
  config?: BitcoinCoinConfig,
): Promise<{ [key: string]: number }> {
  return getExplorer(currencyId, config).getFees();
}

/**
 * Broadcast a raw signed transaction. Returns the transaction id reported by the explorer
 * (empty string if the explorer returns no result — callers must treat that as a failure).
 */
export async function broadcastTx(
  currencyId: string,
  tx: string,
  config?: BitcoinCoinConfig,
  broadcastConfig?: Pick<BroadcastConfig, "source">,
): Promise<string> {
  const res = await getExplorer(currencyId, config).broadcast(tx, broadcastConfig);
  return res?.data?.result ?? "";
}
