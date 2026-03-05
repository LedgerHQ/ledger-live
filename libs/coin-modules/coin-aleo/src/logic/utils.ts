import { createHash } from "crypto";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  Operation as AlpacaOperation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import {
  decodeAccountId,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import aleoConfig from "../config";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID, TRANSACTION_TYPE } from "../constants";
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
  const config = aleoConfig.getCoinConfig(currency);

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
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    rawTx,
    address,
  );

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

export const generateUniqueUsername = (address: string): string => {
  const timestamp = Date.now().toString();
  const combined = `${timestamp}_${address}`;
  const hash = createHash("sha256").update(combined).digest("hex");
  return hash;
};

export function resolveConfig(configOrCurrencyId: AleoCoinConfig | string): AleoCoinConfig {
  if (typeof configOrCurrencyId === "string") {
    const currency = getCryptoCurrencyById(configOrCurrencyId);
    const config = aleoConfig.getCoinConfig(currency);
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

export function calculateAmount({
  account,
  transaction,
  estimatedFees,
}: {
  account: AleoAccount;
  transaction: Transaction;
  estimatedFees: BigNumber;
}) {
  let amount = transaction.amount;

  if (transaction.useAllAmount) {
    const transparentBalance = account.aleoResources?.transparentBalance ?? new BigNumber(0);
    amount = BigNumber.max(0, transparentBalance.minus(estimatedFees));
  }

  const totalSpent = amount.plus(estimatedFees);

  return {
    amount,
    totalSpent,
  };
}

export const isProvableApiConfigured = (
  provableApi: ProvableApi | null,
): provableApi is Required<Pick<ProvableApi, "jwt" | "uuid" | "apiKey">> => {
  return !!provableApi?.uuid && !!provableApi?.apiKey && !!provableApi?.jwt?.token;
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

      return {
        type: "transfer_private",
        amount,
        to,
        record: txIntent.data.record,
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

      return {
        type: "transfer_private_to_public",
        amount,
        to,
        record: txIntent.data.record,
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
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
      return account.aleoResources?.privateBalance ?? new BigNumber(0);
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
    const commitment = transaction.properties.amountRecordCommitment;
    invariant(commitment, "aleo: missing amount record commitment");
    const amountRecord = getRecordByCommitment({ account, commitment });
    invariant(amountRecord, `aleo: no amount record found for commitment ${commitment}`);

    return {
      ...commonFields,
      data: {
        type: transaction.mode,
        record: amountRecord.decryptedData,
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
}: {
  account: AleoAccount;
  transaction: Transaction;
  executionId: string;
  baseFee: BigNumber;
  priorityFee: BigNumber;
}): TransactionIntent<MemoNotSupported, AleoTransactionIntentData> {
  const isPrivateTx = isPrivateTransaction(transaction);
  const commonFields = {
    intentType: "transaction",
    amount: BigInt(baseFee.toFixed(0)),
    asset: { type: "native" },
    recipient: transaction.recipient,
    sender: account.freshAddress,
  } as const;

  if (isPrivateTx) {
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

export function findBestRecordForFee({
  unspentRecords,
  targetFee,
  selectedAmountRecordCommitment,
}: {
  unspentRecords: AleoUnspentRecord[];
  targetFee: BigNumber;
  selectedAmountRecordCommitment: string | null;
}): AleoUnspentRecord | null {
  const recordsSufficientForFee = unspentRecords.filter(
    r =>
      r.commitment !== selectedAmountRecordCommitment &&
      new BigNumber(r.microcredits).gte(targetFee),
  );

  if (recordsSufficientForFee.length === 0) {
    return null;
  }

  // find the smallest record that can cover the fee
  const bestFeeRecord = recordsSufficientForFee.reduce((min, current) =>
    new BigNumber(current.microcredits).lt(new BigNumber(min.microcredits)) ? current : min,
  );

  return bestFeeRecord;
}
