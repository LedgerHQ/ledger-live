import BigNumber from "bignumber.js";
import invariant from "invariant";
import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoPublicTransaction } from "../types/api";
import type { AleoOperation } from "../types";
import { apiClient } from "../network/api";

export function parseMicrocredits(microcreditsU64: string) {
  invariant(microcreditsU64.endsWith("u64"), `aleo: invalid balance format (${microcreditsU64})`);
  return microcreditsU64.slice(0, -3);
}

export async function parseOperation({
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
    id: encodeOperationId(ledgerAccountId, rawTx.transaction_id, type),
    recipients: [rawTx.recipient_address],
    senders: [rawTx.sender_address],
    value: new BigNumber(rawTx.amount),
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: BigNumber(fee_value),
    blockHeight: rawTx.block_number,
    blockHash: block_hash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: rawTx.function_id,
    },
  };
}
