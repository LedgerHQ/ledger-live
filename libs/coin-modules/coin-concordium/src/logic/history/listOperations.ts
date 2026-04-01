import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/index";
import { decodeMemoFromCbor } from "@ledgerhq/concordium-core";
import { log } from "@ledgerhq/logs";
import { getTransactions } from "../../network/proxyClient";
import type { RawOperation, TransactionQueryParams, WalletProxyTransaction } from "../../types";

const DEFAULT_PAGE_SIZE = 100;

export interface RawOperationPage {
  items: RawOperation[];
  next: string | undefined;
}

/**
 * Parses a wallet-proxy transaction into a RawOperation.
 * Returns null for non-transfer transactions or transactions unrelated to the address.
 */
export function parseTransaction(tx: WalletProxyTransaction, address: string): RawOperation | null {
  if (tx.details.type !== "transfer" && tx.details.type !== "transferWithMemo") {
    return null;
  }

  const sender = tx.details.transferSource || "";
  const recipient = tx.details.transferDestination || "";

  const isOutgoing = sender === address;
  const isIncoming = recipient === address;

  if (!isOutgoing && !isIncoming) {
    return null;
  }

  const type = isOutgoing ? "OUT" : "IN";
  const failed = tx.details.outcome === "reject";
  const amount = tx.details.transferAmount || "0";
  const fee = String(tx.cost || 0);

  let value: string;
  if (isOutgoing) {
    value = failed ? fee : String(BigInt(amount) + BigInt(fee));
  } else {
    value = failed ? "0" : amount;
  }

  let memo: string | undefined;
  if (tx.details.memo) {
    try {
      memo = decodeMemoFromCbor(Buffer.from(tx.details.memo, "hex"));
    } catch {
      log("concordium", `Failed to decode memo for tx ${tx.transactionHash}`);
    }
  }

  return {
    hash: tx.transactionHash,
    type,
    sender,
    recipient,
    amount,
    fee,
    value,
    memo,
    date: new Date(Math.floor(tx.blockTime) * 1000),
    blockHash: tx.blockHash || null,
    blockHeight: tx.blockHeight,
    failed,
    id: tx.id,
  };
}

/**
 * Returns list of raw operations associated to an account.
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
): Promise<RawOperationPage> {
  const limit = options.limit || DEFAULT_PAGE_SIZE;

  const params: TransactionQueryParams = {
    limit,
    order: options.order === "asc" ? "a" : "d",
  };

  if (options.minHeight > 0) {
    params.blockHeightFrom = options.minHeight;
  }

  if (options.cursor) {
    params.from = options.cursor;
  }

  try {
    const response = await getTransactions(currencyId, address, params);

    if (!("transactions" in response) || !Array.isArray(response.transactions)) {
      return { items: [], next: undefined };
    }

    const items = response.transactions
      .map(tx => parseTransaction(tx, address))
      .filter((op): op is RawOperation => op !== null);

    const hasMore = response.count >= limit;
    let next: string | undefined;
    if (hasMore && response.transactions.length > 0) {
      const lastTx = response.transactions[response.transactions.length - 1];
      next = String(lastTx.id);
    }

    return { items, next };
  } catch (error) {
    log("concordium", `Error fetching transactions for ${address}`, { error });
    return { items: [], next: undefined };
  }
}
