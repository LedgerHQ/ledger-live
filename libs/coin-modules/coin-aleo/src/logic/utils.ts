import BigNumber from "bignumber.js";
import invariant from "invariant";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType } from "@ledgerhq/types-live";
import type { AleoPublicTransaction } from "../types/api";
import type { AleoOperation } from "../types";
import { apiClient } from "../network/api";
import { PROGRAM_ID } from "../constants";

export function parseMicrocredits(microcreditsU64: string): string {
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
  let type: OperationType = "NONE";
  let fee: number = 0;
  let blockHash: string | null = null;

  if (rawTx.program_id === PROGRAM_ID.CREDITS) {
    const result = await apiClient.getTransactionById(currency, rawTx.transaction_id);

    type = rawTx.recipient_address === address ? "IN" : "OUT";
    fee = result.fee_value;
    blockHash = result.block_hash;
  }

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transaction_id, type),
    recipients: [rawTx.recipient_address],
    senders: [rawTx.sender_address],
    value: new BigNumber(rawTx.amount),
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: new BigNumber(fee),
    blockHeight: rawTx.block_number,
    blockHash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: rawTx.function_id,
    },
  };
}

export function patchAccountWithViewKey(account: Account, viewKey: string): Account {
  const accountIdParams = decodeAccountId(account.id);
  const updatedAccountId = encodeAccountId({
    ...accountIdParams,
    customData: viewKey,
  });

  return {
    ...account,
    id: updatedAccountId,
    operations: account.operations.map(op => {
      const { hash, type } = decodeOperationId(op.id);
      const updatedOperationId = encodeOperationId(updatedAccountId, hash, type);

      return {
        ...op,
        id: updatedOperationId,
        accountId: updatedAccountId,
      };
    }),
  };
}
