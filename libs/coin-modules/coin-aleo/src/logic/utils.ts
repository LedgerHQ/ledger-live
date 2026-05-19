import BigNumber from "bignumber.js";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  Operation as AlpacaOperation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  decodeAccountId,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import aleoConfig from "../config";
import {
  EXPLORER_TRANSFER_TYPES,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  PROGRAM_ID,
  SINGLE_CALL_SIGNING_TIME,
  TRANSACTION_TYPE,
} from "../constants";
import type {
  AleoOperation,
  AleoTransactionType,
  EnrichedPrivateRecord,
  OperationDetailsExtraField,
  Transaction,
  TransactionType,
  ProvableApi,
  TransactionSelfTransfer,
  AleoAccount,
  Intent,
  AleoTransactionIntentData,
  AleoPublicTransaction,
  AleoOperationExtra,
  TransactionPublic,
  TransactionPrivate,
  AleoCoinConfig,
  AleoUnspentRecord,
} from "../types";

export function parseMicrocredits(microcreditsU64: string): string {
  const value = microcreditsU64.split(".")[0];
  const expectedSuffix = "u64";
  const hasValidSuffix = value.endsWith(expectedSuffix);
  invariant(hasValidSuffix, `aleo: invalid microcredits format (${microcreditsU64})`);
  return value.replace(expectedSuffix, "");
}

export function getNetworkConfig(currency: CryptoCurrency) {
  const config = aleoConfig.getCoinConfig(currency.id);

  return {
    nodeUrl: config.apiUrls.node,
    sdkUrl: config.apiUrls.sdk,
    networkType: config.networkType,
  };
}

export function patchAccountWithViewKey(account: Account, viewKey: string): Account {
  invariant(viewKey, `aleo: viewKey is missing in patchAccountWithViewKey ${account.freshAddress}`);
  const accountIdParams = decodeAccountId(account.id);
  const updatedAccountId = encodeAccountId({
    ...accountIdParams,
    customData: viewKey,
  });

  const updateOperations = (ops: Operation[]) =>
    ops.map(op => {
      const { hash, type } = decodeOperationId(op.id);
      const updatedOperationId = encodeOperationId(updatedAccountId, hash, type);

      return {
        ...op,
        id: updatedOperationId,
        accountId: updatedAccountId,
      };
    });

  return {
    ...account,
    id: updatedAccountId,
    operations: updateOperations(account.operations),
    pendingOperations: updateOperations(account.pendingOperations),
  };
}

export const determineTransactionType = (
  functionId: string,
  operationType: OperationType,
): AleoTransactionType => {
  if (functionId === EXPLORER_TRANSFER_TYPES.PRIVATE) return "private";
  if (functionId === EXPLORER_TRANSFER_TYPES.PUBLIC) return "public";

  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) return "private";
    if (functionId.endsWith("to_public")) return "public";
  }

  if (operationType === "OUT") {
    if (functionId.startsWith("transfer_private")) return "private";
    if (functionId.startsWith("transfer_public")) return "public";
  }

  return "public";
};

function parseTransactionFields(rawTx: AleoPublicTransaction, address: string) {
  const date = new Date(Number(rawTx.block_timestamp) * 1000);
  const hasFailed = rawTx.transaction_status !== "Accepted";
  let type: OperationType = "NONE";
  const fee = rawTx.fee;
  const blockHash = rawTx.block_hash;

  if (rawTx.program_id === PROGRAM_ID.CREDITS) {
    type = address === rawTx.recipient_address ? "IN" : "OUT";
  }

  const transactionType = determineTransactionType(rawTx.function_id, type);

  return { type, fee, blockHash, transactionType, date, hasFailed };
}

export const toAlpacaOperation = (
  rawTx: AleoPublicTransaction,
  address: string,
): AlpacaOperation => {
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    rawTx,
    address,
  );
  return {
    id: rawTx.transaction_id,
    type,
    recipients: [rawTx.recipient_address],
    senders: [rawTx.sender_address],
    value: BigInt(rawTx.amount.toFixed(0)),
    asset: { type: "native" },
    details: {
      functionId: rawTx.function_id,
      transactionType,
      ledgerOpType: type,
    },
    tx: {
      hash: rawTx.transaction_id,
      fees: BigInt(fee.toFixed(0)),
      date: date,
      block: {
        hash: blockHash,
        height: rawTx.block_number,
        time: date,
      },
      failed: hasFailed ?? false,
    },
  };
};

export const toBridgeOperation = (
  ledgerAccountId: string,
  rawTx: AleoPublicTransaction,
  address: string,
): AleoOperation => {
  const value = new BigNumber(rawTx.amount);
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    rawTx,
    address,
  );

  if (value.isNaN() || value.lte(0)) {
    log("aleo/toBridgeOperation", `Invalid raw transaction details for ${address}`, rawTx);
  }

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transaction_id, type),
    recipients: [rawTx.recipient_address],
    senders: [rawTx.sender_address],
    value,
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: new BigNumber(fee),
    blockHeight: rawTx.block_number,
    blockHash,
    accountId: ledgerAccountId,
    date,
    extra: {
      functionId: rawTx.function_id,
      transactionType,
    },
  };
};

export const toPrivateBridgeOperation = (
  ledgerAccountId: string,
  enrichedRecord: EnrichedPrivateRecord,
  address: string,
): AleoOperation => {
  const transactionId = enrichedRecord.rawRecord.transaction_id.trim();
  const blockHeight = enrichedRecord.rawRecord.block_height;
  const timestamp = new Date(Number(enrichedRecord.rawRecord.block_timestamp) * 1000);
  const type: OperationType = enrichedRecord.recipient === address ? "IN" : "OUT";

  return {
    id: encodeOperationId(ledgerAccountId, transactionId, type),
    senders: [enrichedRecord.sender],
    recipients: [enrichedRecord.recipient],
    value: enrichedRecord.value,
    type,
    hasFailed: false,
    hash: transactionId,
    fee: new BigNumber(enrichedRecord.details.fee_value),
    blockHeight,
    blockHash: enrichedRecord.details.block_hash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: enrichedRecord.rawRecord.function_name,
      transactionType: "private",
    },
  };
};

export function resolveConfig(configOrCurrencyId: AleoCoinConfig | string): AleoCoinConfig {
  if (typeof configOrCurrencyId === "string") {
    const config = aleoConfig.getCoinConfig(configOrCurrencyId);
    return config;
  }

  return configOrCurrencyId;
}

export function getTransactionType(intent: TransactionIntent): TransactionType {
  const allowedTransactionTypes = Object.values(TRANSACTION_TYPE);
  const transactionType = allowedTransactionTypes.find(v => intent.type === v);
  invariant(transactionType, `aleo: unsupported transaction intent type: ${intent.type}`);

  return transactionType;
}

function getAmountToSpend({
  account,
  transaction,
  estimatedFees,
}: {
  account: AleoAccount;
  transaction: Transaction;
  estimatedFees: BigNumber;
}): BigNumber {
  if (!transaction.useAllAmount) {
    return transaction.amount;
  }

  if (isPrivateTransaction(transaction)) {
    return transaction.properties.amountRecordCommitments.reduce((sum, commitment) => {
      const record = getRecordByCommitment({ account, commitment });
      return record ? sum.plus(record.microcredits) : sum;
    }, new BigNumber(0));
  }

  const transparentBalance = account.aleoResources?.transparentBalance ?? new BigNumber(0);

  return BigNumber.max(0, transparentBalance.minus(estimatedFees));
}

export function calculateAmount({
  account,
  transaction,
  estimatedFees,
}: {
  account: AleoAccount;
  transaction: Transaction;
  estimatedFees: BigNumber;
}) {
  const amount = getAmountToSpend({ account, transaction, estimatedFees });

  const totalSpent = amount.plus(estimatedFees);

  return {
    amount,
    totalSpent,
  };
}

export const isProvableApiConfigured = (
  provableApi: ProvableApi | null,
): provableApi is ProvableApi & { uuid: string } => {
  return !!provableApi?.uuid;
};

export const isRecordScannerReady = (provableApi: ProvableApi): boolean => {
  return provableApi.scannerStatus?.synced === true;
};

export function getOperationTransactionType(transactionType: TransactionType): AleoTransactionType {
  switch (transactionType) {
    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
      return "private";
    default:
      return "public";
  }
}

export function isSelfTransferTransaction(
  transaction: Transaction,
): transaction is TransactionSelfTransfer {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  );
}

export function isPublicTransaction(transaction: Transaction): transaction is TransactionPublic {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PUBLIC
  );
}

export function isPrivateTransaction(transaction: Transaction): transaction is TransactionPrivate {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE
  );
}

export function findBestRecordForFee({
  unspentRecords,
  targetFee,
  selectedAmountRecordCommitments,
}: {
  unspentRecords: AleoUnspentRecord[];
  targetFee: BigNumber;
  selectedAmountRecordCommitments: string[];
}): AleoUnspentRecord | null {
  const recordsSufficientForFee = unspentRecords.filter(
    r =>
      !selectedAmountRecordCommitments.includes(r.commitment) &&
      new BigNumber(r.microcredits).gte(targetFee),
  );

  if (recordsSufficientForFee.length === 0) {
    return null;
  }

  // find the smallest record that can cover the fee
  const bestFeeRecord = recordsSufficientForFee.reduce(
    (min, current) =>
      new BigNumber(current.microcredits).lt(new BigNumber(min.microcredits)) ? current : min,
    recordsSufficientForFee[0],
  );

  return bestFeeRecord;
}

function isPrivateOperation(operation: Operation): boolean {
  const { extra } = operation;
  return (
    typeof extra === "object" &&
    extra !== null &&
    "transactionType" in extra &&
    extra.transactionType === "private"
  );
}

export function splitPrivateAndPublicOperations(
  operations: Operation[],
): [Operation[], Operation[]] {
  const privateOps: Operation[] = [];
  const publicOps: Operation[] = [];
  for (const operation of operations) {
    (isPrivateOperation(operation) ? privateOps : publicOps).push(operation);
  }
  return [privateOps, publicOps];
}

export function hasSpecificIntentData<Type extends AleoTransactionIntentData["type"]>(
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
  expectedType: Type,
): txIntent is Extract<
  TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
  { data: { type: Type } }
> {
  return "data" in txIntent && txIntent.data.type === expectedType;
}

function validateRecordsCount(transactionType: TransactionType, recordsCount: number): void {
  invariant(recordsCount > 0, `aleo: at least one record is required for ${transactionType}`);
  invariant(
    recordsCount <= MAX_PRIVATE_RECORDS_PER_TRANSACTION,
    `aleo: too many records for ${transactionType} (max: ${MAX_PRIVATE_RECORDS_PER_TRANSACTION})`,
  );
}

export function mapTransactionIntentToSdkIntent(
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
): Intent {
  const type = txIntent.type;
  const to = txIntent.recipient;
  const amount = txIntent.amount.toString();

  switch (type) {
    case TRANSACTION_TYPE.TRANSFER_PUBLIC: {
      return {
        type: "transfer_public",
        amount,
        to,
      };
    }
    case TRANSACTION_TYPE.TRANSFER_PRIVATE: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      const records = txIntent.data.records;
      validateRecordsCount(type, records.length);

      if (records.length === 1) {
        return {
          type: "transfer_private",
          amount,
          to,
          record: records[0],
        };
      }

      return {
        type: `transfer_private_${records.length}`,
        amount,
        to,
        records,
      };
    }
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE: {
      return {
        type: "transfer_public_to_private",
        amount,
        to,
      };
    }
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      const records = txIntent.data.records;
      validateRecordsCount(type, records.length);

      if (records.length === 1) {
        return {
          type: "transfer_private_to_public",
          amount,
          to,
          record: records[0],
        };
      }

      return {
        type: `transfer_private_to_public_${records.length}`,
        amount,
        to,
        records,
      };
    }
    case "fee_public": {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);

      return {
        type: "fee_public",
        execution_id: txIntent.data.executionId,
        base_fee: txIntent.amount.toString(),
        priority_fee: (txIntent.data.priorityFee ?? 0).toString(),
      };
    }
    case "fee_private": {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);

      return {
        type: "fee_private",
        execution_id: txIntent.data.executionId,
        base_fee: txIntent.amount.toString(),
        priority_fee: (txIntent.data.priorityFee ?? 0).toString(),
        record: txIntent.data.record,
      };
    }
    default: {
      throw new Error(`aleo: unsupported intent type: ${type}`);
    }
  }
}
export function toHex(tx: unknown): string {
  return Buffer.from(JSON.stringify(tx)).toString("hex");
}

export function fromHex<T>(txHex: string): T {
  return JSON.parse(Buffer.from(txHex, "hex").toString());
}

// this function is used to extract the fields that should be displayed in the operation details
export const getOperationDetailsExtraFields = (
  extra: AleoOperationExtra,
): OperationDetailsExtraField[] => {
  return [{ key: "functionId", value: extra.functionId }];
};

/**
 * Returns the spendable balance for a given Aleo transaction mode.
 *
 * Aleo accounts maintain two balances:
 * - public balance, used for public transfers and for converting public funds into private funds
 * - private balance, used for shielded transfers and for converting private funds back into public funds
 */
export function getAvailableBalance(account: AleoAccount, transaction: Transaction): BigNumber {
  switch (transaction.mode) {
    // spending public balance
    case TRANSACTION_TYPE.TRANSFER_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE:
      return account.aleoResources?.transparentBalance ?? new BigNumber(0);
    // spending private balance
    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC: {
      const unspentPrivateRecords = account.aleoResources?.unspentPrivateRecords ?? [];

      return sumPrivateRecords(
        selectPrivateRecordsForAmount({
          unspentRecords: unspentPrivateRecords,
          targetAmount: null,
        }),
      );
    }
    default:
      // @ts-expect-error - runtime check to ensure all transaction types are handled
      throw new Error(`aleo: unsupported tx mode for balance calculation: ${transaction.mode}`);
  }
}

export function createTransactionIntent({
  account,
  transaction,
}: {
  account: AleoAccount;
  transaction: Transaction;
}): TransactionIntent<MemoNotSupported, AleoTransactionIntentData> {
  const isPrivateTx = isPrivateTransaction(transaction);
  const commonFields = {
    intentType: "transaction",
    amount: BigInt(transaction.amount.toString()),
    asset: { type: "native" },
    recipient: transaction.recipient,
    sender: account.freshAddress,
    type: transaction.mode,
    ...(transaction.useAllAmount && { useAllAmount: true }),
  } as const;

  if (isPrivateTx) {
    const selectedCommitments = transaction.properties.amountRecordCommitments;
    invariant(selectedCommitments.length > 0, "aleo: missing amount record commitments");
    invariant(
      selectedCommitments.length <= MAX_PRIVATE_RECORDS_PER_TRANSACTION,
      `aleo: too many amount record commitments selected (max: ${MAX_PRIVATE_RECORDS_PER_TRANSACTION})`,
    );
    const missingCommitments: string[] = [];
    const decryptedAmountRecords: AleoUnspentRecord["decryptedData"][] = [];

    for (const commitment of selectedCommitments) {
      const record = getRecordByCommitment({ account, commitment });
      if (record) {
        decryptedAmountRecords.push(record.decryptedData);
      } else {
        missingCommitments.push(commitment);
      }
    }

    invariant(
      missingCommitments.length === 0,
      `aleo: no amount records found for given commitments: ${missingCommitments.join(", ")}`,
    );
    invariant(decryptedAmountRecords.length > 0, "aleo: missing amount records");

    return {
      ...commonFields,
      data: {
        type: transaction.mode,
        records: decryptedAmountRecords,
      },
    };
  }

  return commonFields;
}

export function createFeeTransactionIntent({
  account,
  transaction,
  executionId,
  baseFee,
  priorityFee,
  isFeeSponsored,
}: {
  account: AleoAccount;
  transaction: Transaction;
  executionId: string;
  baseFee: BigNumber;
  priorityFee: BigNumber;
  isFeeSponsored: boolean;
}): TransactionIntent<MemoNotSupported, AleoTransactionIntentData> {
  const isPrivateTx = isPrivateTransaction(transaction);
  const commonFields = {
    intentType: "transaction",
    amount: BigInt(baseFee.toFixed(0)),
    asset: { type: "native" },
    recipient: transaction.recipient,
    sender: account.freshAddress,
  } as const;

  if (isPrivateTx && !isFeeSponsored) {
    const commitment = transaction.properties.feeRecordCommitment;
    invariant(commitment, "aleo: missing fee record commitment");
    const feeRecord = getRecordByCommitment({ account, commitment });
    invariant(feeRecord, "aleo: fee record is required for private tx fee intent");

    return {
      ...commonFields,
      type: "fee_private",
      data: {
        type: "fee_private",
        priorityFee: BigInt(priorityFee.toFixed(0)),
        executionId,
        record: feeRecord.decryptedData,
      },
    };
  }

  return {
    ...commonFields,
    type: "fee_public",
    data: {
      type: "fee_public",
      priorityFee: BigInt(priorityFee.toFixed(0)),
      executionId,
    },
  };
}

export function getRecordByCommitment({
  account,
  commitment,
}: {
  account: AleoAccount;
  commitment: string;
}): AleoUnspentRecord | null {
  const unspentPrivateRecords = account.aleoResources?.unspentPrivateRecords ?? [];

  return unspentPrivateRecords.find(record => record.commitment === commitment) ?? null;
}

export function sumPrivateRecords(records: AleoUnspentRecord[]): BigNumber {
  return records.reduce(
    (sum, record) => sum.plus(new BigNumber(record.microcredits)),
    new BigNumber(0),
  );
}

export const getNextSequenceNumber = (account: AleoAccount): BigNumber => {
  const pendingSequenceNumbers = account.pendingOperations
    .map(op => op.transactionSequenceNumber)
    .filter((seq): seq is BigNumber => !!seq && !seq.isNaN());

  return BigNumber.max(-1, ...pendingSequenceNumbers).plus(1);
};

export function getFunctionNameFromTransactionType(transactionType: TransactionType): string {
  switch (transactionType) {
    case TRANSACTION_TYPE.TRANSFER_PUBLIC:
      return "transfer_public";
    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
      return "transfer_private";
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE:
      return "transfer_public_to_private";
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
      return "transfer_private_to_public";
    default:
      throw new Error(`aleo: unsupported transaction type: ${transactionType}`);
  }
}

export function extractViewKey(account: AleoAccount): string {
  const viewKey = decodeAccountId(account.id).customData;
  invariant(viewKey, `aleo: view key is missing in ${account.freshAddress} account`);
  return viewKey;
}

/**
 * Selects the minimum set of private records needed to cover `targetAmount` using a greedy largest-first strategy.
 *
 * - If `targetAmount` is `null`, returns the top `MAX_PRIVATE_RECORDS_PER_TRANSACTION` records by value (useAllAmount mode).
 * - If `targetAmount` is provided and positive:
 *   1. Prefer the **smallest single record** that alone covers the target (fewest records, least overshoot).
 *   2. Otherwise accumulate the **largest records first** until the running total meets the target or
 *      `MAX_PRIVATE_RECORDS_PER_TRANSACTION` is exhausted.
 *
 * Returns `[]` when the target cannot be covered — either because total funds are insufficient
 * or the record cap is exhausted before the running total reaches the target.
 */
export function selectPrivateRecordsForAmount({
  unspentRecords,
  targetAmount,
}: {
  unspentRecords: AleoUnspentRecord[];
  targetAmount: BigNumber | null;
}): AleoUnspentRecord[] {
  const rankedRecords = unspentRecords
    .map(record => ({ record, value: new BigNumber(record.microcredits) }))
    .filter(({ value }) => value.isGreaterThan(0))
    .sort((a, b) => b.value.comparedTo(a.value));

  if (rankedRecords.length === 0) {
    return [];
  }

  // no target amount supplied -> useAllAmount mode, return top N records.
  if (targetAmount === null) {
    return rankedRecords.slice(0, MAX_PRIVATE_RECORDS_PER_TRANSACTION).map(({ record }) => record);
  }

  if (targetAmount.lte(0)) {
    return [];
  }

  // Step 1: Find the smallest single record that covers the target (least overshoot).
  // Scanning from the end of the descending array gives us the smallest candidate first.
  for (let i = rankedRecords.length - 1; i >= 0; i--) {
    if (rankedRecords[i].value.gte(targetAmount)) {
      return [rankedRecords[i].record];
    }
  }

  // Step 2: No single record is sufficient - accumulate largest-first.
  const selected: AleoUnspentRecord[] = [];
  let runningTotal = new BigNumber(0);

  for (const { record, value } of rankedRecords) {
    if (selected.length >= MAX_PRIVATE_RECORDS_PER_TRANSACTION) {
      break;
    }

    selected.push(record);
    runningTotal = runningTotal.plus(value);

    if (runningTotal.gte(targetAmount)) {
      return selected;
    }
  }

  // Target could not be covered within the record cap or with the available funds.
  return [];
}

// Helper function to get estimated signing time based on the number of records being signed.
export const getEstimatedSigningTime = (
  recordCount: number,
  secondShort: string,
  minuteShort: string,
): string => {
  const totalSeconds = (recordCount * SINGLE_CALL_SIGNING_TIME) / 1000;

  if (totalSeconds < 60) {
    return `~${Math.round(totalSeconds)} ${secondShort}`;
  }

  const flooredSeconds = Math.floor(totalSeconds / 30) * 30;
  const minutes = flooredSeconds / 60;
  return `~${minutes} ${minuteShort}`;
};
