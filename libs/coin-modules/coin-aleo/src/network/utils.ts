import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { AleoApiConfigurationResetError } from "../errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  AMOUNT_ARG_INDEX,
  DEFAULT_RECORDS_PAGE_SIZE,
  EXPLORER_TRANSFER_TYPES,
  PROGRAM_ID,
  RECIPIENT_ARG_INDEX,
  TOKEN_RECORD_NAME,
} from "../constants";
import { sdkClient } from "../network/sdk";
import type {
  ProvableApi,
  AleoPublicTransaction,
  EnrichedPrivateRecord,
  AleoPrivateRecord,
  AleoOperation,
  AleoTransition,
} from "../types";
import {
  isAleoAddressPlaintext,
  isAleoAmountPlaintext,
  normalizeAleoPlaintext,
  parseAmount,
  parseMicrocredits,
} from "../logic/utils";
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

    const recentTxs = page.transactions.filter(tx => {
      const hasValidBlockNumber = tx.block_number >= minBlockHeight;

      // Skip transitions that have no direct account involvement (e.g. outer call in a batching contract).
      // Other transition, sharing the same transaction_id, will carry the real amount and addresses.
      // Testnet transaction showing this issue: at1lqugdt847uwnfem2xhzwq6ewrnd6ysjv2gumvglytskutxj3kcpsmc3rrf
      const isInvalidTransition =
        tx.function_id.includes("transfer") &&
        tx.sender_address === "" &&
        tx.recipient_address === "";

      return hasValidBlockNumber && !isInvalidTransition;
    });
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
 * Fetches all pages of owned records from the scanner
 *
 * @param params.currency - The cryptocurrency being accessed
 * @param params.uuid - The scanner UUID for the account
 * @param params.unspent - When true, fetch only unspent records
 * @param params.start - Optional block height to start scanning from
 * @param params.resultsPerPage - Number of records to fetch per page (default: 1000)
 * @returns A flat array of all matching records across all pages
 */
export async function fetchAllOwnedRecords({
  currency,
  uuid,
  unspent,
  start,
  resultsPerPage = DEFAULT_RECORDS_PAGE_SIZE,
  signal,
  programs = [PROGRAM_ID.CREDITS],
  functions = [
    EXPLORER_TRANSFER_TYPES.PRIVATE,
    EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
    EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
  ],
}: {
  currency: CryptoCurrency;
  uuid: string;
  unspent?: boolean;
  start?: number;
  resultsPerPage?: number;
  signal?: AbortSignal;
  programs?: string[];
  functions?: string[];
}): Promise<AleoPrivateRecord[]> {
  const allRecords: AleoPrivateRecord[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    signal?.throwIfAborted();
    const records = await apiClient.getAccountOwnedRecords({
      currency,
      uuid,
      ...(typeof unspent === "boolean" && { unspent }),
      ...(typeof start === "number" && { start }),
      resultsPerPage,
      page,
      programs,
      functions,
    });

    allRecords.push(...records);
    hasMore = records.length === resultsPerPage;
    page += 1;
  }

  return allRecords;
}

/**
 * Manages access to the Provable API by handling authentication and account registration.
 *
 * This function ensures valid API credentials are available and up-to-date. It handles:
 * - Initial account registration if API key or consumer ID are missing
 * - Account registration for scanning records if UUID is not set
 * - Retrieval of current scanner status
 *
 * @param currency - The cryptocurrency being accessed
 * @param viewKey - The view key for the account
 * @param provableApi - Existing Provable API credentials and state, or null for initial setup
 *
 * @returns A Promise resolving to updated ProvableApi credentials
 *
 * @throws {AleoApiConfigurationResetError} When the scanner status endpoint returns 422 — the UUID is no longer valid and registration must restart
 * @throws {Error} Re-throws any other errors from underlying API calls
 */

export async function accessProvableApi({
  currency,
  viewKey,
  provableApi,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  provableApi: ProvableApi | null;
}): Promise<ProvableApi> {
  let uuid = provableApi?.uuid;
  let synced: boolean | undefined = provableApi?.scannerStatus?.synced ?? false;
  let percentage: number | undefined = provableApi?.scannerStatus?.percentage ?? 0;
  let status;

  if (!uuid) {
    const { public_key, key_id } = await apiClient.getScannerPublicKey(currency);

    const { encrypted: encryptedData } = await sdkClient.encryptRegistrationPayload({
      currency,
      publicKey: public_key,
      viewKey,
      start: 0,
    });

    const { uuid: accountUuid } = await apiClient.registerForScanningAccountRecordsEncrypted({
      currency,
      encryptedData,
      keyId: key_id,
    });

    uuid = accountUuid;
  }

  try {
    status = await apiClient.getRecordScannerStatus(currency, uuid);
  } catch (error) {
    if (error instanceof LedgerAPI4xx && error.status === 422) {
      throw new AleoApiConfigurationResetError();
    }
    throw error;
  }

  if (status) {
    synced = status.synced;
    percentage = status.percentage;
  }

  return {
    uuid,
    scannerStatus: { synced, percentage },
  };
}

type EnrichedRecordData = Pick<EnrichedPrivateRecord, "sender" | "recipient" | "value">;
type AleoTransitionInputWithValue = AleoTransition["inputs"][number] & { value: string };

// PUBLIC_TO_PRIVATE where sender is this address is already captured as a public OUT op.
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
): AleoTransition | null {
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
  input: AleoTransition["inputs"][number] | null,
): input is AleoTransitionInputWithValue {
  return Boolean(input && "value" in input);
}

function getTransferArguments(
  isTokenRecord: boolean,
  recordTransition: AleoTransition,
  transactionId: string,
): {
  recipientArgument: AleoTransitionInputWithValue;
  amountArgument: AleoTransitionInputWithValue;
  recipientOutputIndex: number;
  amountOutputIndex: number;
} | null {
  const recipientOutputIndex = isTokenRecord ? RECIPIENT_ARG_INDEX - 1 : RECIPIENT_ARG_INDEX;
  const amountOutputIndex = isTokenRecord ? AMOUNT_ARG_INDEX - 1 : AMOUNT_ARG_INDEX;

  if (recordTransition.inputs.length <= amountOutputIndex) {
    log(
      "aleo/sync",
      `enrichPrivateRecord: transition has only ${recordTransition.inputs.length} inputs, expected at least ${amountOutputIndex + 1} for tx ${transactionId}`,
    );
    return null;
  }

  // Recipient and amount are contract function arguments, so their inputs must have a `value` field.
  // Other input (missing `value` field) would indicate unexpected API data.
  // In that case we skip processing rather than crash.
  const recipientInput = recordTransition.inputs[recipientOutputIndex] ?? null;
  const amountInput = recordTransition.inputs[amountOutputIndex] ?? null;

  if (!hasValueField(recipientInput) || !hasValueField(amountInput)) {
    log("aleo/sync", `enrichPrivateRecord: invalid transition arguments for tx ${transactionId}`);
    return null;
  }

  return {
    recipientArgument: recipientInput,
    amountArgument: amountInput,
    recipientOutputIndex,
    amountOutputIndex,
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
  recordTransition: AleoTransition;
  transactionId: string;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData | null> {
  const isTokenRecord = rawRecord.record_name.toLowerCase() === TOKEN_RECORD_NAME.toLowerCase();
  const transferArguments = getTransferArguments(isTokenRecord, recordTransition, transactionId);
  if (!transferArguments) {
    return null;
  }

  const { recipientArgument, amountArgument, recipientOutputIndex, amountOutputIndex } =
    transferArguments;

  if (rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
    // The recipient and amount stay public for private-to-public transfers,
    // so we can build the outgoing operation directly from the transition inputs.
    if (recipientArgument.value === address) {
      return null;
    }

    return {
      sender: address,
      recipient: recipientArgument.value,
      value: new BigNumber(parseMicrocredits(amountArgument.value)),
    };
  }

  const [recipientData, amountData] = await Promise.all([
    sdkClient.decryptCiphertext({
      currency,
      ciphertext: recipientArgument.value,
      tpk: recordTransition.tpk,
      viewKey,
      programId: rawRecord.program_name,
      functionName: rawRecord.function_name,
      outputIndex: recipientOutputIndex,
    }),
    sdkClient.decryptCiphertext({
      currency,
      ciphertext: amountArgument.value,
      tpk: recordTransition.tpk,
      viewKey,
      programId: rawRecord.program_name,
      functionName: rawRecord.function_name,
      outputIndex: amountOutputIndex,
    }),
  ]);

  return {
    sender: address,
    recipient: recipientData.plaintext,
    value: new BigNumber(parseMicrocredits(amountData.plaintext)),
  };
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
        const programId =
          operation.extra.programId ?? recordTransition.program ?? PROGRAM_ID.CREDITS;

        const recipientData = await sdkClient.decryptCiphertext({
          currency,
          ciphertext: recipientArgument.value,
          tpk: recordTransition.tpk,
          viewKey,
          programId,
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

/**
 * For an outgoing (OUT) private token transfer, reads both the transferred amount and
 * the recipient address from the transition inputs. The spent input record's own
 * `amount` is the full pre-send balance — NOT the amount sent.
 *
 * Returns null fields when the transition data is unavailable or cannot be parsed;
 * callers should fall back to 0 for amount and omit the recipient.
 */
export async function getTokenOutDetails({
  currency,
  record,
  viewKey,
}: {
  currency: CryptoCurrency;
  record: AleoPrivateRecord;
  viewKey: string;
}): Promise<{ amount: BigNumber | null; recipient: string | null; fee: BigNumber }> {
  const txDetails = await apiClient.getTransactionById(currency, record.transaction_id.trim());
  const fee = new BigNumber(txDetails.fee_value);
  const transition = txDetails.execution?.transitions[record.transition_index];

  if (!transition)
    return {
      amount: null,
      recipient: null,
      fee,
    };

  // token programs have different argument indices
  const recipientOutputIndex = RECIPIENT_ARG_INDEX - 1;
  const amountOutputIndex = AMOUNT_ARG_INDEX - 1;

  const plaintexts = transition.inputs.flatMap(inp =>
    inp.type === "public" ? [normalizeAleoPlaintext(inp.value)] : [],
  );
  const recipient = plaintexts.find(isAleoAddressPlaintext) ?? null;

  // For private_to_public the amount argument is already in plaintext at AMOUNT_ARG_INDEX.
  if (record.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
    // Amount is already in plaintext — scan inputs by pattern instead of assuming a
    // fixed argument index (token programs may differ from credits.aleo).
    const amountStr = plaintexts.find(isAleoAmountPlaintext) ?? null;
    return { amount: amountStr ? parseAmount(amountStr) : null, recipient, fee };
  }

  // Fully private transfer: decrypt recipient and amount arguments by their function
  // argument indices (same layout as credits.aleo transfer_private), not input array position.
  if (transition.inputs.length <= amountOutputIndex) {
    return { amount: null, recipient, fee };
  }

  const decryptTransitionArgument = async (argumentIndex: number): Promise<string | null> => {
    const input = transition.inputs[argumentIndex];
    if (!input || !("value" in input) || !input.value) return null;

    try {
      const dec = await sdkClient.decryptCiphertext({
        currency,
        ciphertext: input.value,
        tpk: transition.tpk,
        viewKey,
        programId: record.program_name,
        functionName: record.function_name,
        outputIndex: argumentIndex,
      });
      return dec.plaintext;
    } catch {
      return null;
    }
  };

  const [recipientPlaintext, amountPlaintext] = await Promise.all([
    decryptTransitionArgument(recipientOutputIndex),
    decryptTransitionArgument(amountOutputIndex),
  ]);

  const resolvedRecipient =
    recipient ??
    (recipientPlaintext && isAleoAddressPlaintext(recipientPlaintext)
      ? normalizeAleoPlaintext(recipientPlaintext)
      : null);

  const amount =
    amountPlaintext && isAleoAmountPlaintext(amountPlaintext)
      ? normalizeAleoPlaintext(amountPlaintext)
      : null;

  return {
    amount: amount ? parseAmount(amount) : null,
    recipient: resolvedRecipient,
    fee,
  };
}
