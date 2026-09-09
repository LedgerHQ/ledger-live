import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { AleoApiConfigurationResetError } from "../errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  DEFAULT_RECORDS_PAGE_SIZE,
  DEFAULT_TOKENS_PAGE_SIZE,
  EXPLORER_TRANSFER_TYPES,
  PROGRAM_ID,
  TRANSACTION_TYPE,
} from "../constants";
import { sdkClient } from "../network/sdk";
import type {
  ProvableApi,
  AleoPublicTransaction,
  EnrichedPrivateRecord,
  AleoPrivateRecord,
  AleoOperation,
  AleoTransition,
  AleoCoinConfig,
  AleoRecordScannerStatusResponse,
  AleoDecryptedRecordResponse,
  AleoTokenDetails,
  AleoTransitionCursor,
  AleoExactTransitionCursor,
  AleoStakingPosition,
} from "../types";
import {
  hasPublicAddress,
  findTransferArguments,
  isAleoAddressPlaintext,
  isParsableTransferFunction,
  normalizeAleoPlaintext,
  parseAmount,
  parseMicrocredits,
  toStakingPosition,
} from "../logic/utils";
import { register } from "../logic/register";
import { apiClient } from "./api";

export async function getStakingPosition(
  config: AleoCoinConfig,
  address: string,
): Promise<AleoStakingPosition> {
  const [bondedRaw, unbondingRaw, withdrawRaw] = await Promise.all([
    apiClient.getBondedMapping(config, address),
    apiClient.getUnbondingMapping(config, address),
    apiClient.getWithdrawMapping(config, address),
  ]);

  return toStakingPosition({ bondedRaw, unbondingRaw, withdrawRaw });
}

export async function getUnbondingValidators(
  config: AleoCoinConfig,
  addresses: string[],
): Promise<Set<string>> {
  const flagged = await promiseAllBatched(4, addresses, async address => {
    const raw = await apiClient.getUnbondingMapping(config, address).catch(() => null);
    return raw ? address : null;
  });

  return new Set(flagged.filter((address): address is string => address !== null));
}

export async function decryptRecordAmount(
  config: AleoCoinConfig,
  viewKey: string,
  record: AleoPrivateRecord,
): Promise<{ amount: BigNumber; details: AleoDecryptedRecordResponse }> {
  const details = await sdkClient.decryptRecord({
    config,
    viewKey,
    ciphertext: record.record_ciphertext,
  });
  const raw = details.data?.amount ?? details.data?.balance ?? details.data?.microcredits;

  return {
    amount: parseAmount(raw ?? null),
    details,
  };
}

/**
 * Sums the decrypted amount of every unspent record.
 *
 * @param maxBlockHeight - Excludes records scanned past this height. Omit to sum all records.
 */
export async function sumUnspentRecords({
  config,
  viewKey,
  records,
  maxBlockHeight,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  records: AleoPrivateRecord[];
  maxBlockHeight?: number;
}): Promise<BigNumber> {
  const filteredRecords = records.filter(record => {
    if (typeof maxBlockHeight !== "number") return true;
    return record.block_height <= maxBlockHeight;
  });

  const amounts = await promiseAllBatched(4, filteredRecords, async record => {
    const decryptedRecord = await decryptRecordAmount(config, viewKey, record);
    return decryptedRecord.amount;
  });

  return amounts.reduce((sum, amount) => sum.plus(amount), new BigNumber(0));
}

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

/**
 * A transition with no direct account involvement (e.g. the outer call of a batching contract);
 * a sibling transition of the same transaction carries the real amount and addresses.
 * Testnet transaction showing this: at1lqugdt847uwnfem2xhzwq6ewrnd6ysjv2gumvglytskutxj3kcpsmc3rrf
 */
function isUnaddressedTransfer(tx: AleoPublicTransaction): boolean {
  return tx.function_id.includes("transfer") && !hasPublicAddress(tx);
}

function toExactCursor(tx: AleoPublicTransaction): AleoExactTransitionCursor {
  return { blockNumber: tx.block_number, transitionId: tx.transition_id };
}

/**
 * One page of the explorer's per-transition stream, cut on a block boundary: the block the stream
 * stops inside is handed to the next page whole, so a caller may bound record fetching by block
 * height. `next` is `null` once the stream is exhausted.
 */
export async function fetchTransitionPage({
  config,
  address,
  cursor,
  limit,
  order = "asc",
}: {
  config: AleoCoinConfig;
  address: string;
  cursor?: AleoTransitionCursor;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<{
  transitions: AleoPublicTransaction[];
  next: AleoExactTransitionCursor | null;
}> {
  const transitions: AleoPublicTransaction[] = [];
  let currentCursor = cursor;
  let hasMorePages = true;
  let closedRows: AleoPublicTransaction[] = [];

  while (hasMorePages && closedRows.length === 0) {
    const page = await apiClient.getAccountPublicTransactions({
      config,
      address,
      order,
      ...(limit && { limit }),
      ...(currentCursor && { cursor: currentCursor }),
    });

    transitions.push(...page.transactions.filter(tx => !isUnaddressedTransfer(tx)));

    const lastRow = page.transactions.at(-1);

    if (!page.next_cursor || !lastRow) {
      hasMorePages = false;
    } else {
      currentCursor = toExactCursor(lastRow);

      const openBlock = lastRow.block_number;
      closedRows = transitions.filter(tx => tx.block_number !== openBlock);
    }
  }

  const lastClosedRow = closedRows.at(-1);
  if (!lastClosedRow) return { transitions, next: null };

  return { transitions: closedRows, next: toExactCursor(lastClosedRow) };
}

export async function fetchAccountTransactionsFromHeight({
  config,
  address,
  fetchAllPages,
  minBlockHeight,
  cursor,
  limit = 50,
  order = "asc",
}: {
  config: AleoCoinConfig;
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
      config,
      address,
      limit,
      order,
      ...(currentCursor && { cursor: { blockNumber: Number(currentCursor) } }),
    });

    const nextCursorBlockNumber = page.next_cursor?.block_number.toString() ?? null;
    hasMorePages = nextCursorBlockNumber !== null;

    const recentTxs = page.transactions.filter(
      tx => tx.block_number >= minBlockHeight && !isUnaddressedTransfer(tx),
    );
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
 * @param params.config - The Aleo coin config
 * @param params.uuid - The scanner UUID for the account
 * @param params.unspent - When true, fetch only unspent records
 * @param params.start - Optional block height to start scanning from
 * @param params.resultsPerPage - Number of records to fetch per page (default: 1000)
 * @returns A flat array of all matching records across all pages
 */
export async function fetchAllOwnedRecords({
  config,
  uuid,
  unspent,
  start,
  end,
  resultsPerPage = DEFAULT_RECORDS_PAGE_SIZE,
  signal,
  programs = [PROGRAM_ID.CREDITS],
  functions = [
    EXPLORER_TRANSFER_TYPES.PRIVATE,
    EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
    EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
    EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
  ],
}: {
  config: AleoCoinConfig;
  uuid: string;
  unspent?: boolean;
  start?: number;
  end?: number;
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
      config,
      uuid,
      ...(typeof unspent === "boolean" && { unspent }),
      ...(typeof start === "number" && { start }),
      ...(typeof end === "number" && { end }),
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
 * Fetches the full token registry (ARC-20, ARC-21 and ARC-22 alike).
 *
 * The `/tokens` endpoint has no program-name filter, so identifying whether a given
 * program is a known token requires the full registry rather than a per-program lookup.
 */
export async function fetchAllTokens({
  config,
  resultsPerPage = DEFAULT_TOKENS_PAGE_SIZE,
}: {
  config: AleoCoinConfig;
  resultsPerPage?: number;
}): Promise<AleoTokenDetails[]> {
  const tokens: AleoTokenDetails[] = [];
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const { data, pagination } = await apiClient.getTokens({
      config,
      options: {
        limit: resultsPerPage,
        offset,
      },
    });

    tokens.push(...data);
    hasNext = pagination.has_next;
    offset += resultsPerPage;
  }

  return tokens;
}

/** Reads the scanner status, mapping a dropped enrollment to {@link AleoApiConfigurationResetError}. */
export async function getRecordScannerStatusOrThrow(
  config: AleoCoinConfig,
  uuid: string,
): Promise<AleoRecordScannerStatusResponse> {
  try {
    return await apiClient.getRecordScannerStatus(config, uuid);
  } catch (error) {
    const err = error as { name?: string; status?: number } | null | undefined;
    if (err?.name === "LedgerAPI4xx" && err?.status === 422) {
      throw new AleoApiConfigurationResetError();
    }
    throw error;
  }
}

/**
 * Manages access to the Provable API by handling authentication and account registration.
 *
 * This function ensures valid API credentials are available and up-to-date. It handles:
 * - Initial account registration if API key or consumer ID are missing
 * - Account registration for scanning records if UUID is not set
 * - Retrieval of current scanner status
 *
 * @param config - The Aleo coin config
 * @param viewKey - The view key for the account
 * @param provableApi - Existing Provable API credentials and state, or null for initial setup
 *
 * @returns A Promise resolving to updated ProvableApi credentials
 *
 * @throws {AleoApiConfigurationResetError} When the scanner status endpoint returns 422 — the UUID is no longer valid and registration must restart
 * @throws {Error} Re-throws any other errors from underlying API calls
 */

export async function accessProvableApi({
  config,
  viewKey,
  provableApi,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  provableApi: ProvableApi | null;
}): Promise<ProvableApi> {
  let uuid = provableApi?.uuid;
  let synced: boolean | undefined = provableApi?.scannerStatus?.synced ?? false;
  let percentage: number | undefined = provableApi?.scannerStatus?.percentage ?? 0;

  if (!uuid) {
    const { provableId } = await register(config, viewKey);
    uuid = provableId;
  }

  const status = await getRecordScannerStatusOrThrow(config, uuid);

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

function getInputValue(input: AleoTransition["inputs"][number]): string | null {
  return "value" in input && input.value ? input.value : null;
}

/**
 * Reads the validator and bonded amount of every `bond_public` transaction in `transactions`,
 * keyed by transaction id; a transaction whose transition cannot be read is simply absent.
 *
 * The explorer's per-address listing blanks both sides and reports `amount: 0` for every staking
 * call, so they have to be read back from the transaction. Unlike a transfer these are plain
 * public inputs of a fixed signature — `bond_public(validator, withdrawal, amount)` — so they are
 * taken positionally and no view key is involved.
 */
export async function resolveBondArguments({
  config,
  transactions,
}: {
  config: AleoCoinConfig;
  transactions: AleoPublicTransaction[];
}): Promise<Map<string, { validator: string; amount: BigNumber }>> {
  const resolved = new Map<string, { validator: string; amount: BigNumber }>();

  await promiseAllBatched(4, transactions, async tx => {
    const transactionId = tx.transaction_id;
    const { execution } = await apiClient.getTransactionById(config, transactionId);
    // A staking call may be wrapped by another program (Pondo and friends), so match the
    // credits.aleo transition rather than trusting position in the transition list.
    const transition = execution?.transitions.find(
      ts => ts.program === PROGRAM_ID.CREDITS && ts.function === TRANSACTION_TYPE.BOND_PUBLIC,
    );
    if (!transition) return;

    const validator = getInputValue(transition.inputs[0]);
    const amount = getInputValue(transition.inputs[2]);

    if (!validator || !amount || !isAleoAddressPlaintext(validator)) {
      log("aleo/sync", `resolveBondArguments: unreadable bond_public inputs for ${transactionId}`);
      return;
    }

    resolved.set(transactionId, {
      validator: normalizeAleoPlaintext(validator),
      amount: parseAmount(amount),
    });
  });

  return resolved;
}

/**
 * Reads a transfer transition's recipient and amount, decrypting its private arguments only when
 * the public ones are not enough.
 *
 * Returns null silently for non-transfer functions such as join/split.
 */
export async function resolveTransferArguments({
  config,
  transition,
  transactionId,
  viewKey,
}: {
  config: AleoCoinConfig;
  transition: AleoTransition;
  transactionId: string;
  viewKey: string;
}): Promise<{ recipient: string; amount: string } | null> {
  if (!isParsableTransferFunction(transition.function)) {
    return null;
  }

  const inputValues = transition.inputs.map(input =>
    input.type === "private" ? null : getInputValue(input),
  );
  const publicArguments = findTransferArguments(inputValues);

  if (publicArguments) {
    return publicArguments;
  }

  const decryptionErrors: unknown[] = [];

  const plaintexts = await Promise.all(
    transition.inputs.map(async (input, index) => {
      const value = getInputValue(input);
      if (!value) return null;
      if (input.type !== "private") return value;

      try {
        // The owning record's program/function cannot decrypt a batching wrapper's inputs.
        const { plaintext } = await sdkClient.decryptCiphertext({
          config,
          ciphertext: value,
          tpk: transition.tpk,
          viewKey,
          programId: transition.program,
          functionName: transition.function,
          outputIndex: index,
        });
        return plaintext;
      } catch (error) {
        decryptionErrors.push(error);
        return null;
      }
    }),
  );

  const transferArguments = findTransferArguments(plaintexts);

  if (transferArguments) {
    return transferArguments;
  }

  // Arguments we never needed (trailing merkle proofs) may fail to decrypt; a failure only matters
  // when it leaves the transfer unreadable, where reporting a zero amount would be worse.
  if (decryptionErrors.length > 0) {
    throw decryptionErrors[0];
  }

  log(
    "aleo/sync",
    `resolveTransferArguments: no recipient/amount arguments found in ${transition.program}/${transition.function} for tx ${transactionId}`,
  );

  return null;
}

async function enrichOutgoingRecord({
  config,
  rawRecord,
  recordTransition,
  transactionId,
  viewKey,
  address,
}: {
  config: AleoCoinConfig;
  rawRecord: AleoPrivateRecord;
  recordTransition: AleoTransition;
  transactionId: string;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData | null> {
  const transferArguments = await resolveTransferArguments({
    config,
    transition: recordTransition,
    transactionId,
    viewKey,
  });

  if (!transferArguments) {
    return null;
  }

  // A private-to-public transfer to our own public balance is already the public side of this op.
  if (
    rawRecord.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC &&
    transferArguments.recipient === address
  ) {
    return null;
  }

  return {
    sender: address,
    recipient: transferArguments.recipient,
    value: new BigNumber(parseMicrocredits(transferArguments.amount)),
  };
}

async function enrichIncomingRecord({
  config,
  rawRecord,
  transactionId,
  viewKey,
  address,
}: {
  config: AleoCoinConfig;
  rawRecord: AleoPrivateRecord;
  transactionId: string;
  viewKey: string;
  address: string;
}): Promise<EnrichedRecordData | null> {
  const outputRecord = await sdkClient.decryptRecord({
    config,
    ciphertext: rawRecord.record_ciphertext,
    viewKey,
  });
  const microcredits = outputRecord.data?.microcredits ?? outputRecord.data?.amount;

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
  config,
  rawRecord,
  address,
  viewKey,
}: {
  config: AleoCoinConfig;
  rawRecord: AleoPrivateRecord;
  address: string;
  viewKey: string;
}): Promise<EnrichedPrivateRecord | null> {
  const transactionId = rawRecord.transaction_id.trim();

  // Fee records are not transfer operations.
  // Their transition lives in details.fee.transition, not details.execution.transitions,
  // so transition_index may resolve to the wrong execution transition (e.g. the token transfer),
  // leading to wrong decryption or a crash. Skip them explicitly.
  if (rawRecord.function_name === EXPLORER_TRANSFER_TYPES.FEE_PRIVATE) {
    return null;
  }

  const details = await apiClient.getTransactionById(config, transactionId);

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
          config,
          rawRecord,
          recordTransition,
          transactionId,
          viewKey,
          address,
        })
      : await enrichIncomingRecord({
          config,
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

export async function enrichPrivateRecords({
  config,
  viewKey,
  address,
  records,
  onProgress,
  signal,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  address: string;
  records: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<(EnrichedPrivateRecord | null)[]> {
  let completed = 0;

  return promiseAllBatched(2, records, async rawRecord => {
    signal?.throwIfAborted();
    const result = await enrichPrivateRecord({ config, rawRecord, address, viewKey });
    onProgress?.(++completed, records.length);
    return result;
  });
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
  config,
  publicOperations,
  privateRecords,
  address,
  ledgerAccountId,
  viewKey,
}: {
  config: AleoCoinConfig;
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
      const txDetails = await apiClient.getTransactionById(config, operation.hash);
      const recordTransition = txDetails.execution.transitions[0] ?? null;

      // if this is public to private, our account is sender, so it's possible to decrypt the recipient address
      const transferArguments =
        recordTransition && operation.extra.functionId === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE
          ? await resolveTransferArguments({
              config,
              transition: recordTransition,
              transactionId: operation.hash,
              viewKey,
            })
          : null;

      if (transferArguments) {
        const shouldMarkAsPatched = latestPrivateRecordBlockHeight >= txDetails.block_height;

        patchedOperations.push({
          ...operation,
          recipients: [transferArguments.recipient],
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
  config,
  record,
  viewKey,
}: {
  config: AleoCoinConfig;
  record: AleoPrivateRecord;
  viewKey: string;
}): Promise<{ amount: BigNumber | null; recipient: string | null; fee: BigNumber }> {
  const transactionId = record.transaction_id.trim();
  const txDetails = await apiClient.getTransactionById(config, transactionId);
  const fee = new BigNumber(txDetails.fee_value);
  const transition = txDetails.execution?.transitions[record.transition_index];

  if (!transition)
    return {
      amount: null,
      recipient: null,
      fee,
    };

  const transferArguments = await resolveTransferArguments({
    config,
    transition,
    transactionId,
    viewKey,
  });

  if (!transferArguments) {
    return { amount: null, recipient: null, fee };
  }

  return {
    amount: parseAmount(transferArguments.amount),
    recipient: transferArguments.recipient,
    fee,
  };
}
