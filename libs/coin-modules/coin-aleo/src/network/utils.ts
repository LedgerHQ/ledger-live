import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import {
  AMOUNT_ARG_INDEX,
  EXPLORER_TRANSFER_TYPES,
  PROGRAM_ID,
  RECIPIENT_ARG_INDEX,
} from "../constants";
import { sdkClient } from "../network/sdk";
import type {
  ProvableApi,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
  EnrichedTransaction,
  EnrichedPrivateRecord,
  AleoPrivateRecord,
} from "../types";
import { generateUniqueUsername, parseMicrocredits } from "../logic/utils";
import { apiClient } from "./api";

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

// transactions list doesn't include all the details we need to build the operation, so we need to fetch them separately
export async function enrichTransaction({
  currency,
  rawTx,
}: {
  currency: CryptoCurrency;
  rawTx: AleoPublicTransaction;
}): Promise<EnrichedTransaction> {
  let details: AleoPublicTransactionDetailsResponse | null = null;

  if (rawTx.program_id === PROGRAM_ID.CREDITS) {
    details = await apiClient.getTransactionById(currency, rawTx.transaction_id);
  }

  return {
    rawTx,
    details,
  };
}

/**
 * Manages access to the Provable API by handling authentication and account registration.
 *
 * This function ensures valid API credentials are available and up-to-date. It handles:
 * - Initial account registration if API key or consumer ID are missing
 * - JWT token refresh when expired or about to expire (within 5 minutes)
 * - Account registration for scanning records if UUID is not set
 * - Retrieval of current scanner status
 *
 * @param currency - The cryptocurrency being accessed
 * @param viewKey - The view key for the account
 * @param address - The account address
 * @param provableApi - Existing Provable API credentials and state, or null for initial setup
 *
 * @returns A Promise resolving to updated ProvableApi credentials, or null if access needs to be reset
 *
 * @throws {Error} Re-throws any errors except unauthorized errors during JWT retrieval
 *
 * @remarks
 * Edge cases that trigger Provable API access reset (returns null):
 * - Unauthorized error during JWT retrieval, typically indicating:
 *   - Revoked API key
 *   - Invalid consumer credentials
 *   - Account access has been terminated
 *
 * When null is returned, the caller should clear stored Provable API credentials
 * and allow the user to re-initialize access from scratch.
 */

const JWT_EXPIRY_BUFFER_SECONDS = 5 * 60; // 5 minutes safe buffer

export async function accessProvableApi({
  currency,
  viewKey,
  address,
  provableApi,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  provableApi: ProvableApi | null;
}): Promise<ProvableApi | null> {
  let apiKey = provableApi?.apiKey;
  let consumerId = provableApi?.consumerId;
  let jwt = provableApi?.jwt;
  let uuid = provableApi?.uuid;
  let synced: boolean | undefined = provableApi?.scannerStatus?.synced ?? false;
  let percentage: number | undefined = provableApi?.scannerStatus?.percentage ?? 0;

  if (!apiKey || !consumerId) {
    const username = generateUniqueUsername(address);

    const { key, consumer } = await apiClient.registerNewAccount(currency, username);

    apiKey = key;
    consumerId = consumer.id;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (!jwt || currentTimestamp >= jwt.exp - JWT_EXPIRY_BUFFER_SECONDS) {
    try {
      jwt = await apiClient.getAccountJWT(currency, apiKey, consumerId);
    } catch (error) {
      // If unauthorized, likely due to revoked API key - return null to reset Provable API access
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return null;
      }
      throw error;
    }
  }

  if (!uuid) {
    const { public_key, key_id } = await apiClient.getPublicKey(currency, jwt.token);

    const { encrypted: encryptedData } = await sdkClient.encryptRegistrationPayload({
      currency,
      publicKey: public_key,
      viewKey,
      start: 0,
    });

    const { uuid: accountUuid } = await apiClient.registerForScanningAccountRecordsEncrypted({
      currency,
      jwt: jwt.token,
      encryptedData,
      keyId: key_id,
    });
    uuid = accountUuid;
  }

  const status = await apiClient.getRecordScannerStatus(currency, jwt.token, uuid);
  if (status) {
    synced = status.synced;
    percentage = status.percentage;
  }

  return {
    apiKey,
    consumerId,
    jwt,
    uuid,
    scannerStatus: { synced, percentage },
  };
}

export async function enrichPrivateRecord({
  currency,
  rawRecord,
  address,
  viewKey,
}: {
  currency: CryptoCurrency;
  rawRecord: AleoPrivateRecord;
  address: string;
  viewKey: string;
}): Promise<EnrichedPrivateRecord | null> {
  const transactionId = rawRecord.transaction_id.trim();
  const details = await apiClient.getTransactionById(currency, transactionId);

  // PUBLIC_TO_PRIVATE where sender is this address is already captured as a public OUT op
  if (
    rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE &&
    rawRecord.sender === address
  ) {
    return null;
  }

  const recordTransition = details.execution?.transitions[rawRecord.transition_index];
  if (!recordTransition) {
    log(
      "aleo/sync",
      `enrichPrivateRecord: transition at index ${rawRecord.transition_index} not found for tx ${transactionId}`,
    );
    return null;
  }

  let recipient = "";
  let sender = "";
  let value: BigNumber;

  if (rawRecord.sender === address) {
    if (recordTransition.inputs.length <= AMOUNT_ARG_INDEX) {
      log(
        "aleo/sync",
        `enrichPrivateRecord: transition has only ${recordTransition.inputs.length} inputs, expected at least ${AMOUNT_ARG_INDEX + 1} for tx ${transactionId}`,
      );
      return null;
    }

    if (rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
      if (recordTransition.inputs[RECIPIENT_ARG_INDEX].value === address) return null;
      sender = address;
      recipient = recordTransition.inputs[RECIPIENT_ARG_INDEX].value;
      value = new BigNumber(parseMicrocredits(recordTransition.inputs[AMOUNT_ARG_INDEX].value));
    } else {
      const [recipientData, amountData] = await Promise.all([
        sdkClient.decryptCiphertext({
          currency,
          ciphertext: recordTransition.inputs[RECIPIENT_ARG_INDEX].value,
          tpk: recordTransition.tpk,
          viewKey,
          programId: rawRecord.program_name,
          functionName: rawRecord.function_name,
          outputIndex: RECIPIENT_ARG_INDEX,
        }),
        sdkClient.decryptCiphertext({
          currency,
          ciphertext: recordTransition.inputs[AMOUNT_ARG_INDEX].value,
          tpk: recordTransition.tpk,
          viewKey,
          programId: rawRecord.program_name,
          functionName: rawRecord.function_name,
          outputIndex: AMOUNT_ARG_INDEX,
        }),
      ]);
      sender = address;
      recipient = recipientData.plaintext;
      value = new BigNumber(parseMicrocredits(amountData.plaintext));
    }
  } else {
    const outputRecord = await sdkClient.decryptRecord({
      currency,
      ciphertext: rawRecord.record_ciphertext,
      viewKey,
    });
    const microcredits = outputRecord.data?.microcredits;
    if (!microcredits) {
      log(
        "aleo/sync",
        `enrichPrivateRecord: microcredits missing in decrypted record for tx ${transactionId}`,
      );
      return null;
    }
    sender = rawRecord.sender;
    recipient = address;
    value = new BigNumber(parseMicrocredits(microcredits));
  }

  return { rawRecord, details, sender, recipient, value };
}
