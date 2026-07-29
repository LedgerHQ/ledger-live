import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import type { TX } from "@ledgerhq/wallet-btc/index";
import { walletBtcCurrencyById } from "./walletBtcCurrency";

/**
 * Address-indexed transparent history, from the Ledger explorer
 * (`/blockchain/v4/zec/address/{address}/txs`).
 *
 * Why not the Zaino gRPC endpoint the rest of this module talks to: it has no
 * address index. Its shielded scan is driven by a viewing key, and the
 * transparent lookups lightwalletd defines (`GetTaddressTxids`,
 * `GetAddressUtxos`) are not exposed by the zcash-utils binding. The explorer
 * is what wallet-btc already syncs Zcash accounts through, so the wire format
 * and the paging token are the ones the bridge path is validated against.
 *
 * This covers transparent value only -- by construction, since Orchard and
 * Sapling notes are encrypted to a viewing key and no explorer can index them.
 */

/** wallet-btc's own page size for this route (`txsSyncArraySize`). */
export const TXS_PAGE_SIZE = 1000;

export type TransparentTxsPage = {
  txs: TX[];
  /** The explorer's paging token, `null` once the history is exhausted. */
  next: string | null;
};

export type FetchTransparentTxsOptions = {
  /** Inclusive lower bound on block height. */
  fromHeight?: number | undefined;
  /** Paging token returned by a previous call. */
  token?: string | null | undefined;
  batchSize?: number | undefined;
};

/**
 * One page of an address's confirmed transactions, oldest first.
 *
 * `account` and `index` are wallet-btc's derivation coordinates, which it only
 * stamps onto the returned transactions -- a bare address has none, so they
 * read 0. Nothing downstream of here consumes them.
 */
export async function fetchTransparentTxs(
  address: string,
  { fromHeight = 0, token = null, batchSize = TXS_PAGE_SIZE }: FetchTransparentTxsOptions = {},
): Promise<TransparentTxsPage> {
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: walletBtcCurrencyById("zcash"),
  });

  const { txs, nextPageToken } = await explorer.getTxsSinceBlockheight(
    batchSize,
    { address, account: 0, index: 0 },
    fromHeight,
    undefined,
    false,
    token,
  );

  return { txs, next: nextPageToken };
}
