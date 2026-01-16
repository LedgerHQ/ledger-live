import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { apiClient } from "../network/api";
import type { AleoPublicTransaction } from "../types/api";
import type { AleoOperation } from "../types/bridge";

async function parseOperation({
  currency,
  rawTx,
  address,
  ledgerAccountId,
}: {
  currency: CryptoCurrency;
  rawTx: AleoPublicTransaction;
  address: string;
  ledgerAccountId: string;
}): Promise<AleoOperation> {
  const timestamp = new Date(Number(rawTx.block_timestamp) * 1000);
  const hasFailed = rawTx.transaction_status !== "Accepted";
  const type = rawTx.recipient_address === address ? "IN" : "OUT";

  const { fee_value, block_hash } = await apiClient.getTranscationByTransactionId(
    currency,
    rawTx.transaction_id,
  );

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transition_id, rawTx.function_id),
    recipients: [rawTx.recipient_address],
    senders: [rawTx.sender_address],
    value: new BigNumber(rawTx.amount),
    type,
    hasFailed,
    hash: rawTx.transition_id,
    fee: BigNumber(fee_value),
    blockHeight: rawTx.block_number,
    blockHash: block_hash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {},
  };
}

export async function listOperations({
  currency,
  address,
  ledgerAccountId,
  pagination,
  direction = "next",
}: {
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  pagination: Pagination;
  direction?: "prev" | "next" | undefined;
}): Promise<{ publicOperations: AleoOperation[] }> {
  const publicOperations: AleoOperation[] = [];
  const mirrorResult = await apiClient.getAccountPublicTransactions({
    currency,
    address,
    minHeight: pagination.minHeight ?? null,
    order: pagination.order,
    direction,
    limit: pagination.limit,
  });

  // currently we only support native aleo coin operations & ignore rest
  const nativePublicTransactions = mirrorResult.transactions.filter(
    tx => tx.program_id === "credits.aleo",
  );

  for (const rawTx of nativePublicTransactions) {
    const parsedOperation = await parseOperation({
      currency,
      rawTx,
      address,
      ledgerAccountId,
    });

    publicOperations.push(parsedOperation);
  }

  return {
    publicOperations,
  };
}
