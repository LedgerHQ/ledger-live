import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { AMOUNT_ARG_INDEX, PROGRAM_ID, RECIPIENT_ARG_INDEX, TRANSFERS } from "../constants";
import { determineTransactionType, parseMicrocredits } from "../logic/utils";
import type { AleoOperation, AleoPrivateRecord, AleoPublicTransaction } from "../types";
import { apiClient } from "./api";
import { sdkClient } from "./sdk";

function limitTransactions(
  transactions: AleoPublicTransaction[],
  limit: number,
): AleoPublicTransaction[] {
  return transactions.length > limit ? transactions.slice(0, limit) : transactions;
}

function getLastTransactionCursor(transactions: AleoPublicTransaction[]): string | null {
  return transactions.at(-1)?.block_number.toString() ?? null;
}

function hasReachedMinHeight(
  transactions: AleoPublicTransaction[],
  minBlockHeight: number,
): boolean {
  return transactions.some(tx => tx.block_number < minBlockHeight);
}

export async function fetchAccountTransactionsFromHeight({
  currency,
  address,
  fetchAllPages,
  minBlockHeight,
  cursor,
  limit = 50,
  order = "asc",
}: {
  currency: CryptoCurrency;
  address: string;
  fetchAllPages: boolean;
  minBlockHeight: number;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<{
  transactions: AleoPublicTransaction[];
  nextCursor: string | null;
}> {
  const transactions: AleoPublicTransaction[] = [];
  let currentCursor = cursor ?? null;
  let hasMorePages = true;

  while (hasMorePages) {
    const page = await apiClient.getAccountPublicTransactions({
      currency,
      address,
      limit,
      order,
      ...(currentCursor && { cursor: currentCursor }),
    });

    const nextCursorBlockNumber = page.next_cursor?.block_number.toString() ?? null;
    hasMorePages = nextCursorBlockNumber !== null;

    const recentTxs = page.transactions.filter(tx => tx.block_number >= minBlockHeight);
    transactions.push(...recentTxs);

    // stop if DESC order hit the min height boundary
    if (order === "desc" && hasReachedMinHeight(page.transactions, minBlockHeight)) {
      const limitedTxs = limitTransactions(transactions, limit);

      return {
        transactions: fetchAllPages ? transactions : limitedTxs,
        nextCursor: null,
      };
    }

    // pagination mode: check if we don't have more than requested
    if (!fetchAllPages && transactions.length >= limit) {
      const limitedTxs = limitTransactions(transactions, limit);
      const nextCursor = getLastTransactionCursor(limitedTxs);

      return {
        transactions: limitedTxs,
        nextCursor,
      };
    }

    // no more pages - return what we have
    if (!hasMorePages) {
      const limitedTxs = limitTransactions(transactions, limit);

      return {
        transactions: fetchAllPages ? transactions : limitedTxs,
        nextCursor: null,
      };
    }

    currentCursor = nextCursorBlockNumber;
  }

  // should not be reached, just a type guard
  throw new Error("aleo: unexpected end of loop in fetchAccountTransactionsFromHeight");
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

  const transactionType = determineTransactionType(rawTx.function_id, type);

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
      transactionType,
    },
  };
}

export async function parsePrivateOperation({
  currency,
  rawTx,
  address,
  ledgerAccountId,
  viewKey,
}: {
  currency: CryptoCurrency;
  rawTx: AleoPrivateRecord;
  address: string;
  ledgerAccountId: string;
  viewKey: string;
}): Promise<AleoOperation | null> {
  const [transactionDetails, outputRecord] = await Promise.all([
    apiClient.getTransactionById(currency, rawTx.transaction_id),
    sdkClient.decryptRecord(rawTx.record_ciphertext, viewKey),
  ]);

  const transactionId = rawTx.transaction_id.trim();
  const blockHeight = rawTx.block_height;
  const blockHash = transactionDetails.block_hash;
  const timestamp = new Date(Number(transactionDetails.block_timestamp) * 1000);
  const hasFailed = transactionDetails.status !== "Accepted";
  let recipient = "";
  let sender = "";
  let value = new BigNumber(0);

  // PROGRAM INPUTS, BASED ON TRANSITION INDEX
  const recordTransition = transactionDetails.execution.transitions[rawTx.transition_index];

  // REMOVE ALREADY PARSED SEMI PUBLIC OPERATIONS
  if (rawTx.function_name === TRANSFERS.PUBLIC_TO_PRIVATE && rawTx.sender === address) return null;

  if (rawTx.sender === address) {
    // DECRYPT RECIPIENT & AMOUNT
    // ONLY THE SENDER CAN DECRYPT THESE VALUES
    const [recipientData, amountData] = await Promise.all([
      sdkClient.decryptCiphertext({
        ciphertext: recordTransition.inputs[RECIPIENT_ARG_INDEX].value,
        tpk: recordTransition.tpk,
        viewKey,
        programId: rawTx.program_name,
        functionName: rawTx.function_name,
        outputIndex: RECIPIENT_ARG_INDEX,
      }),
      sdkClient.decryptCiphertext({
        ciphertext: recordTransition.inputs[AMOUNT_ARG_INDEX].value,
        tpk: recordTransition.tpk,
        viewKey,
        programId: rawTx.program_name,
        functionName: rawTx.function_name,
        outputIndex: AMOUNT_ARG_INDEX,
      }),
    ]);

    sender = address;
    recipient = recipientData.plaintext;
    value = new BigNumber(parseMicrocredits(amountData.plaintext));
  } else {
    // IN OPERATION FROM OTHER ACCOUNT
    sender = rawTx.sender;
    recipient = address;
    value = new BigNumber(parseMicrocredits(outputRecord.data?.microcredits));
  }

  const type = recipient === address ? "IN" : "OUT";

  return {
    id: encodeOperationId(ledgerAccountId, transactionId, type),
    senders: [sender],
    recipients: [recipient],
    value,
    type,
    hasFailed,
    hash: transactionId,
    fee: new BigNumber(transactionDetails.fee_value),
    blockHeight,
    blockHash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: rawTx.function_name,
      transactionType: "private",
    },
  };
}
