import type { TonTransaction } from "@ledgerhq/coin-ton/network/types";
import type { Address } from "@ton/core";

/** toncenter's v3 API (ton-indexer) over the local chain, as published by docker-compose.yml. */
export const INDEXER_URL = "http://127.0.0.1:18083/api/v3";

/** The account's latest transactions, none while the indexer API is not listening yet. */
export async function latestTransactions(account: Address): Promise<TonTransaction[]> {
  let response: Response;
  try {
    response = await fetch(
      `${INDEXER_URL}/transactions?account=${account.toRawString()}&limit=10&sort=desc`,
    );
  } catch {
    return [];
  }
  if (!response.ok) throw new Error(`The indexer answered ${response.status}`);
  return ((await response.json()) as { transactions: TonTransaction[] }).transactions;
}
