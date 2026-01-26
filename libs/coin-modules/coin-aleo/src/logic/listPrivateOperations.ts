import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { AleoOperation } from "../types/bridge";
import { apiClient } from "../network/api";
import type { AleoDecryptedTransactionValueResponse, AleoPrivateTransaction } from "../types/api";

async function parseOperation({
  currency,
  rawTx,
  address,
  ledgerAccountId,
  viewKey,
}: {
  currency: CryptoCurrency;
  rawTx: AleoPrivateTransaction;
  address: string;
  ledgerAccountId: string;
  viewKey: string;
}): Promise<AleoOperation> {
  const timestamp = new Date(Number(rawTx.block_timestamp) * 1000);
  const hasFailed = rawTx.status !== "Accepted";

  const { fee_value, block_hash, execution } = await apiClient.getTransactionById(
    currency,
    rawTx.transaction_id,
  );
  const receiver = await apiClient
    .decryptCiphertext<AleoDecryptedTransactionValueResponse>(
      execution.transitions[0].outputs[0].value,
      viewKey,
    )
    .catch(() => null);
  const sender = await apiClient
    .decryptCiphertext<AleoDecryptedTransactionValueResponse>(
      execution.transitions[0].outputs[1].value,
      viewKey,
    )
    .catch(() => null);
  const type = receiver?.owner === address ? "IN" : "OUT";
  const value = receiver?.data?.microcredits ?? sender?.data?.microcredits ?? "0.0";

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transition_id, rawTx.function_name),
    senders: [sender?.owner ?? ""],
    recipients: [receiver?.owner ?? ""],
    value: new BigNumber(value.split(".")[0]),
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: BigNumber(fee_value),
    blockHeight: rawTx.block_height,
    blockHash: block_hash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: rawTx.function_name,
    },
  };
}

export async function listPrivateOperations({
  currency,
  jwtToken,
  uuid,
  apiKey,
  viewKey,
  address,
  ledgerAccountId,
}: {
  currency: CryptoCurrency;
  jwtToken: string;
  uuid: string;
  apiKey: string;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
}): Promise<{ privateOperations: AleoOperation[] }> {
  const privateOperations: AleoOperation[] = [];
  const mirrorResult = await apiClient.getAccountOwnedRecords(currency, jwtToken, uuid, apiKey);

  // currently we only support native aleo coin operations & ignore rest
  const nativePrivateTransactions = mirrorResult.filter(tx => tx.program_name === "credits.aleo");

  for (const rawTx of nativePrivateTransactions) {
    const parsedOperation = await parseOperation({
      currency,
      rawTx,
      viewKey,
      address,
      ledgerAccountId,
    });

    privateOperations.push(parsedOperation);
  }

  return {
    privateOperations,
  };
}
