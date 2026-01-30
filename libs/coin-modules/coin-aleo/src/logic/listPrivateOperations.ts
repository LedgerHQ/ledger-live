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
  const { fee_value, block_hash, execution, status, block_timestamp } =
    await apiClient.getTransactionById(currency, rawTx.transaction_id);
  const timestamp = new Date(Number(block_timestamp) * 1000);
  const hasFailed = status !== "Accepted";
  const [receiverOutput, senderOutput] = execution.transitions[0].outputs;
  const receiver = await apiClient
    .decryptCiphertext<AleoDecryptedTransactionValueResponse>(receiverOutput?.value, viewKey)
    .catch(e => console.log(`Failed to decrypt receiver output: ${e}`));
  const sender = await apiClient
    .decryptCiphertext<AleoDecryptedTransactionValueResponse>(senderOutput?.value, viewKey)
    .catch(e => console.log(`Failed to decrypt sender output: ${e}`));
  const senderAddress = sender?.owner?.split(".")[0] ?? "";
  const receiverAddress = receiver?.owner?.split(".")[0] ?? "";
  const type = receiverAddress === address ? "IN" : "OUT";
  const value = receiver?.data?.microcredits ?? sender?.data?.microcredits ?? "0u0";

  await apiClient
    .getTransactionById(currency, rawTx.transaction_id)
    .then(res =>
      console.log(rawTx, res, {
        id: encodeOperationId(ledgerAccountId, rawTx.transition_id, rawTx.function_name),
        senders: senderAddress === "" ? [] : [senderAddress],
        recipients: receiverAddress === "" ? [] : [receiverAddress],
        value: new BigNumber(value.split("u")[0]),
        type,
        hasFailed,
        hash: rawTx.transaction_id,
        fee: new BigNumber(fee_value),
        blockHeight: rawTx.block_height,
        blockHash: block_hash,
        accountId: ledgerAccountId,
        date: timestamp,
        extra: {
          functionId: rawTx.function_name,
        },
      }),
    )
    .catch(() => {});

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transition_id, rawTx.function_name),
    senders: senderAddress === "" ? [] : [senderAddress],
    recipients: receiverAddress === "" ? [] : [receiverAddress],
    value: new BigNumber(value.split("u")[0]),
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: new BigNumber(fee_value),
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
  const mirrorResult = await apiClient.getAccountOwnedRecords(jwtToken, uuid, apiKey);

  // currently we only support native aleo coin operations & ignore rest
  const nativePrivateTransactions = mirrorResult.filter(
    ({ program_name, function_name }) =>
      program_name === "credits.aleo" && function_name === "transfer_private",
  );

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

  console.log({ privateOperations });

  return {
    privateOperations,
  };
}
