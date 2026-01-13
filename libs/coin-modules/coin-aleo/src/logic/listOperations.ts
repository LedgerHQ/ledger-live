import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { apiClient } from "../network/api";
import type { AleoPublicTransaction } from "../types/api";
import type { AleoOperation, AleoOperationExtra } from "../types/bridge";

function getCommonOperationData(rawTx: AleoPublicTransaction) {
  const timestamp = new Date(Number(rawTx.block_timestamp) * 1000);
  const hash = rawTx.transition_id;
  const blockHeight = rawTx.block_number;
  const hasFailed = rawTx.transaction_status !== "Accepted";
  const extra: AleoOperationExtra = {};

  return {
    timestamp,
    hash,
    hasFailed,
    blockHeight,
    blockHash: null,
    extra,
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

  // currently we only support native aleo coin operations
  const nativePublicTransactions = mirrorResult.transactions.filter(
    tx => tx.program_id === "credits.aleo",
  );

  // FIXME: parse transfers
  for (const rawTx of nativePublicTransactions) {
    const commonData = getCommonOperationData(rawTx);

    const { fee_value } = await apiClient.getTranscationByTransactionId(
      currency,
      rawTx.transaction_id,
    );

    publicOperations.push({
      id: encodeOperationId(ledgerAccountId, rawTx.transition_id, rawTx.function_id),
      recipients: [rawTx.recipient_address],
      senders: [rawTx.sender_address],
      value: new BigNumber(rawTx.amount),
      // FIXME: extend with OTHER for internal conversions?
      type: rawTx.recipient_address === address ? "IN" : "OUT",
      hasFailed: commonData.hasFailed,
      hash: rawTx.transaction_id,
      fee: BigNumber(fee_value),
      blockHeight: commonData.blockHeight,
      blockHash: undefined,
      accountId: ledgerAccountId,
      date: commonData.timestamp,
      extra: commonData.extra,
    });
  }

  return {
    publicOperations,
  };
}
