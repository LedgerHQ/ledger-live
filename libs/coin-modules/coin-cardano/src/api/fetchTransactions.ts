import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APITransaction } from "./api-types";

async function fetchTransactionsPage(
  paymentKeys: Array<string>,
  pageNo: number,
  blockHeight: number,
  currency: CryptoCurrency,
): Promise<{
  pageNo: number;
  // Untyped network response: limit may be missing or non-numeric. Callers must coerce the
  // value (as getAllTransactionsByKeys does) rather than trust a `number`.
  limit?: unknown;
  blockHeight: number;
  transactions: Array<APITransaction>;
}> {
  const res = await network({
    method: "POST",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/transaction`
      : `${CARDANO_API_ENDPOINT}/v1/transaction`,
    data: {
      paymentKeys,
      pageNo,
      blockHeight,
    },
  });
  return res.data;
}

/**
 * Fetch every transaction touching the given payment credential(s) from `/v1/transaction`,
 * walking pages until a short page (or no advertised limit) ends the sequence. Single source
 * of pagination for both account sync and the CoinModule API, so the termination rule cannot
 * drift between them — which matters for balance correctness.
 */
export async function getAllTransactionsByKeys(
  paymentKeys: Array<string>,
  blockHeight: number,
  currency: CryptoCurrency,
): Promise<{
  transactions: Array<APITransaction>;
  blockHeight: number;
}> {
  const transactions: Array<APITransaction> = [];
  let latestBlockHeight = 0;
  let pageNo = 1;

  for (;;) {
    const res = await fetchTransactionsPage(paymentKeys, pageNo, blockHeight, currency);
    transactions.push(...res.transactions);
    latestBlockHeight = Math.max(res.blockHeight, latestBlockHeight);
    // A short page (or no advertised limit) means there are no further pages. `limit` comes from
    // an untyped network response, so coerce it: a missing/non-numeric/non-positive limit ends
    // the loop rather than letting `length < undefined` (always false) run it unbounded.
    const limit = Number(res.limit);
    if (!Number.isFinite(limit) || limit <= 0 || res.transactions.length < limit) break;
    pageNo += 1;
  }

  return { transactions, blockHeight: latestBlockHeight };
}
