import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
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
  EnrichedPrivateRecord,
  AleoPrivateRecord,
  AleoOperation,
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
    const { public_key, key_id } = await apiClient.getScannerPublicKey(currency, jwt.token);

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

type EnrichedRecordData = Pick<EnrichedPrivateRecord, "sender" | "recipient" | "value">;
type RecordTransition = NonNullable<
  EnrichedPrivateRecord["details"]["execution"]
>["transitions"][number];
type RecordTransitionInputWithValue = RecordTransition["inputs"][number] & { value: string };

function shouldSkipPublicToPrivateRecord(rawRecord: AleoPrivateRecord, address: string): boolean {
  return (
    rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE &&
    rawRecord.sender === address
  );
}

function getRecordTransition(
  details: EnrichedPrivateRecord["details"],
  rawRecord: AleoPrivateRecord,
  transactionId: string,
): RecordTransition | null {
  const recordTransition = details.execution?.transitions[rawRecord.transition_index];

  if (!recordTransition) {
    log(
      "aleo/sync",
      `enrichPrivateRecord: transition at index ${rawRecord.transition_index} not found for tx ${transactionId}`,
    );
    return null;
  }

  return recordTransition;
}

function hasValueField(
  input: RecordTransition["inputs"][number] | null,
): input is RecordTransitionInputWithValue {
  return Boolean(input && "value" in input);
}

function getTransferArguments(
  recordTransition: RecordTransition,
  transactionId: string,
): {
  recipientArgument: RecordTransitionInputWithValue;
  amountArgument: RecordTransitionInputWithValue;
} | null {
  if (recordTransition.inputs.length <= AMOUNT_ARG_INDEX) {
    log(
      "aleo/sync",
      `enrichPrivateRecord: transition has only ${recordTransition.inputs.length} inputs, expected at least ${AMOUNT_ARG_INDEX + 1} for tx ${transactionId}`,
    );
    return null;
  }

  // Recipient and amount are contract function arguments, so their inputs must have a `value` field.
  // Other input (missing `value` field) would indicate unexpected API data.
  // In that case we skip processing rather than crash.
  const recipientInput = recordTransition.inputs[RECIPIENT_ARG_INDEX] ?? null;
  const amountInput = recordTransition.inputs[AMOUNT_ARG_INDEX] ?? null;

  if (!hasValueField(recipientInput) || !hasValueField(amountInput)) {
    log("aleo/sync", `enrichPrivateRecord: invalid transition arguments for tx ${transactionId}`);
    return null;
  }

  return {
    recipientArgument: recipientInput,
    amountArgument: amountInput,
  };
}

function enrichPrivateToPublicTransfer({
  recipientArgument,
  amountArgument,
  address,
}: {
  recipientArgument: RecordTransitionInputWithValue;
  amountArgument: RecordTransitionInputWithValue;
  address: string;
}): EnrichedRecordData | null {
  if (recipientArgument.value === address) {
    return null;
  }

  return {
    sender: address,
    recipient: recipientArgument.value,
    value: new BigNumber(parseMicrocredits(amountArgument.value)),
  };
}

async function enrichOutgoingPrivateTransfer({
  currency,
  rawRecord,
  recordTransition,
  recipientArgument,
  amountArgument,
  viewKey,
  address,
}: {
  currency: CryptoCurrency;
  rawRecord: AleoPrivateRecord;
  recordTransition: RecordTransition;
  recipientArgument: RecordTransitionInputWithValue;
  amountArgument: RecordTransitionInputWithValue;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData> {
  const [recipientData, amountData] = await Promise.all([
    sdkClient.decryptCiphertext({
      currency,
      ciphertext: recipientArgument.value,
      tpk: recordTransition.tpk,
      viewKey,
      programId: rawRecord.program_name,
      functionName: rawRecord.function_name,
      outputIndex: RECIPIENT_ARG_INDEX,
    }),
    sdkClient.decryptCiphertext({
      currency,
      ciphertext: amountArgument.value,
      tpk: recordTransition.tpk,
      viewKey,
      programId: rawRecord.program_name,
      functionName: rawRecord.function_name,
      outputIndex: AMOUNT_ARG_INDEX,
    }),
  ]);

  return {
    sender: address,
    recipient: recipientData.plaintext,
    value: new BigNumber(parseMicrocredits(amountData.plaintext)),
  };
}

async function enrichOutgoingRecord({
  currency,
  rawRecord,
  recordTransition,
  transactionId,
  viewKey,
  address,
}: {
  currency: CryptoCurrency;
  rawRecord: AleoPrivateRecord;
  recordTransition: RecordTransition;
  transactionId: string;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData | null> {
  const transferArguments = getTransferArguments(recordTransition, transactionId);
  if (!transferArguments) {
    return null;
  }

  const { recipientArgument, amountArgument } = transferArguments;

  if (rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
    return enrichPrivateToPublicTransfer({
      recipientArgument,
      amountArgument,
      address,
    });
  }

  return enrichOutgoingPrivateTransfer({
    currency,
    rawRecord,
    recordTransition,
    recipientArgument,
    amountArgument,
    viewKey,
    address,
  });
}

async function enrichIncomingRecord({
  currency,
  rawRecord,
  transactionId,
  viewKey,
  address,
}: {
  currency: CryptoCurrency;
  rawRecord: AleoPrivateRecord;
  transactionId: string;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData | null> {
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

  return {
    sender: rawRecord.sender,
    recipient: address,
    value: new BigNumber(parseMicrocredits(microcredits)),
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
  if (shouldSkipPublicToPrivateRecord(rawRecord, address)) {
    return null;
  }

  const recordTransition = getRecordTransition(details, rawRecord, transactionId);
  if (!recordTransition) {
    return null;
  }

  const enrichedRecordData =
    rawRecord.sender === address
      ? await enrichOutgoingRecord({
          currency,
          rawRecord,
          recordTransition,
          transactionId,
          viewKey,
          address,
        })
      : await enrichIncomingRecord({
          currency,
          rawRecord,
          transactionId,
          viewKey,
          address,
        });

  if (!enrichedRecordData) {
    return null;
  }

  return { rawRecord, details, ...enrichedRecordData };
}

function splitPublicAndSemiPublicOperations(
  operations: AleoOperation[],
): [AleoOperation[], AleoOperation[]] {
  const semiPublicOps: AleoOperation[] = [];
  const publicOps: AleoOperation[] = [];
  const semiPublicFunctionIds = new Set([
    EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
    EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
  ]);

  for (const operation of operations) {
    const isSemiPublic = semiPublicFunctionIds.has(operation.extra.functionId);
    (isSemiPublic ? semiPublicOps : publicOps).push(operation);
  }

  return [semiPublicOps, publicOps];
}

/**
 * Patches public operations to handle semi transparent transactions (public_to_private and private_to_public).
 * For self-transfers involving private records, creates additional operations to show both sides of the transfer.
 *
 * @param publicOperations - List of public operations to check
 * @param privateRecords - List of owned private records
 * @param address - The account address
 * @param ledgerAccountId - The Ledger account ID
 * @returns Array of patched operations including additional operations for semi transparent transfers
 */
export const patchPublicOperations = async ({
  currency,
  publicOperations,
  privateRecords,
  address,
  ledgerAccountId,
  viewKey,
}: {
  currency: CryptoCurrency;
  publicOperations: AleoOperation[];
  privateRecords: AleoPrivateRecord[];
  address: string;
  ledgerAccountId: string;
  viewKey: string;
}): Promise<AleoOperation[]> => {
  const patchedOperations: AleoOperation[] = [];
  const [semiPublicOperations, fullyPublicOperations] =
    splitPublicAndSemiPublicOperations(publicOperations);

  const latestPrivateRecordBlockHeight = privateRecords.reduce((max, record) => {
    // this should be recordScanner.status.lastBlockHeight, but we don't have such information yet
    // current implementation guarantees no duplicates, but it can enter else condition many times
    return Math.max(max, record.block_height);
  }, 0);

  for (const operation of semiPublicOperations) {
    // skip already patched operations to avoid duplication
    if (operation.extra.patched) {
      patchedOperations.push(operation);
      continue;
    }

    // try to find a matching private record, ignore fee_private records
    const privateRecord = privateRecords.find(
      record =>
        record.transaction_id.trim() === operation.hash.trim() &&
        record.function_name !== "fee_private",
    );

    // if private record was found, operation can be one of:
    // - self transfer from public to private
    // - self transfer from private to public
    if (privateRecord) {
      // for self-transfers, the original operation is IN or OUT
      // we can patch senders/recipients + add cloned operation with opposite type
      const oppositeOperationType = operation.type === "IN" ? "OUT" : "IN";
      const oppositeTransactionType =
        operation.extra.transactionType === "private" ? "public" : "private";

      // ensure unique date for sorting for cloned operations
      const dateOffset = oppositeOperationType === "OUT" ? -1 : 1;
      const oppositeOperationDate = new Date(operation.date.getTime() + dateOffset);

      patchedOperations.push(
        {
          ...operation,
          senders: privateRecord.sender ? [privateRecord.sender] : operation.senders,
          recipients: [address],
          extra: {
            ...operation.extra,
            patched: true,
          },
        },
        {
          ...operation,
          id: encodeOperationId(ledgerAccountId, operation.hash, oppositeOperationType),
          type: oppositeOperationType,
          date: oppositeOperationDate,
          senders: [address],
          recipients: [address],
          extra: {
            ...operation.extra,
            transactionType: oppositeTransactionType,
            patched: true,
          },
        },
      );
    }
    // if private record was not found, operation can be one of:
    // - semi-transparent transfer from another account to another account
    // - semi-transparent transfer from our own account to another account
    else {
      const txDetails = await apiClient.getTransactionById(currency, operation.hash);
      const recordTransition = txDetails.execution.transitions[0] ?? null;
      const recipientInput = recordTransition?.inputs[0] ?? {};
      const recipientArgument = "value" in recipientInput ? recipientInput : null;

      // if this is public to private, our account is sender, so it's possible to decrypt the recipient address
      // arguments of transfer_public_to_private function are (address_ciphertext, amount)
      if (
        recipientArgument &&
        operation.extra.functionId === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE
      ) {
        const shouldMarkAsPatched = latestPrivateRecordBlockHeight >= txDetails.block_height;
        const recipientData = await sdkClient.decryptCiphertext({
          currency,
          ciphertext: recipientArgument.value,
          tpk: recordTransition.tpk,
          viewKey,
          programId: PROGRAM_ID.CREDITS,
          functionName: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          outputIndex: 0,
        });

        patchedOperations.push({
          ...operation,
          recipients: [recipientData.plaintext],
          extra: {
            ...operation.extra,
            // record scanner may be delayed, so we can consider the operation as patched only when
            // we are sure that record scanner block height is greater than or equal to the block height of the transaction
            ...(shouldMarkAsPatched && { patched: true }),
          },
        });
      }
      // private to public is IN operation
      else {
        patchedOperations.push(operation);
      }
    }
  }

  patchedOperations.push(...fullyPublicOperations);

  return patchedOperations;
};
