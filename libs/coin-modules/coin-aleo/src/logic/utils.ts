import BigNumber from "bignumber.js";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import type {
  Operation as CoinFrameworkOperation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  decodeAccountId,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import aleoConfig from "../config";
import {
  EXPLORER_TRANSFER_TYPES,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
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
  AleoTokenAccount,
  Intent,
  AleoTransactionIntentData,
  AleoPublicTransaction,
  AleoOperationExtra,
  TransactionPublic,
  TransactionPrivate,
  AleoCoinConfig,
  AleoUnspentRecord,
  AleoTransactionIntent,
} from "../types";

const MICROCREDITS_REGEX = /^(\d+)u\d+$/;

export function normalizeAleoPlaintext(v: string): string {
  return v.trim().replace(/\.(private|public|constant)$/, "");
}

function matchAleoPlaintextAmount(raw: string): string | null {
  const match = MICROCREDITS_REGEX.exec(normalizeAleoPlaintext(raw));
  return match?.[1] ?? null;
}

export function parseMicrocredits(microcredits: string): string {
  const amount = matchAleoPlaintextAmount(microcredits);
  invariant(amount !== null, `aleo: invalid microcredits format (${microcredits})`);
  return amount;
}

export function parseAmount(raw: string | null): BigNumber {
  if (!raw) return new BigNumber(0);
  return new BigNumber(matchAleoPlaintextAmount(raw) ?? 0);
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

  const updatedAccountId = encodeAccountId({
    ...decodeAccountId(account.id),
    customData: viewKey,
  });

  // Single source of truth for old → new sub-account IDs.
  const subAccountIdMap = new Map<string, string>(
    account.subAccounts?.map(sub => [sub.id, encodeTokenAccountId(updatedAccountId, sub.token)]) ??
      [],
  );

  const updateOps = (ops: Operation[], targetAccountId: string): Operation[] =>
    ops.map(op => {
      const { hash, type } = decodeOperationId(op.id);

      const updatedSubOperations = op.subOperations?.map(subOp => {
        const newSubAccountId = subAccountIdMap.get(subOp.accountId) ?? subOp.accountId;
        const { hash: subHash, type: subType } = decodeOperationId(subOp.id);
        return {
          ...subOp,
          id: encodeOperationId(newSubAccountId, subHash, subType),
          accountId: newSubAccountId,
        };
      });

      return {
        ...op,
        id: encodeOperationId(targetAccountId, hash, type),
        accountId: targetAccountId,
        ...(updatedSubOperations && { subOperations: updatedSubOperations }),
      };
    });

  const updatedSubAccounts = account.subAccounts?.map((sub: TokenAccount) => {
    const newTokenAccountId = subAccountIdMap.get(sub.id)!;
    return {
      ...sub,
      id: newTokenAccountId,
      parentId: updatedAccountId,
      operations: updateOps(sub.operations, newTokenAccountId),
      pendingOperations: updateOps(sub.pendingOperations, newTokenAccountId),
    };
  });

  return {
    ...account,
    id: updatedAccountId,
    operations: updateOps(account.operations, updatedAccountId),
    pendingOperations: updateOps(account.pendingOperations, updatedAccountId),
    ...(updatedSubAccounts && { subAccounts: updatedSubAccounts }),
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

export const toCoinFrameworkOperation = (
  rawTx: AleoPublicTransaction,
  address: string,
): CoinFrameworkOperation => {
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
  isTokenTx?: boolean,
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
      ...(isTokenTx && { programId: rawTx.program_id }),
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

export function getAleoSubAccount(
  account: AleoAccount,
  subAccountId: string | null | undefined = "",
): AleoTokenAccount | undefined {
  if (!subAccountId) {
    return undefined;
  }

  return account.subAccounts?.find(
    (subAccount): subAccount is AleoTokenAccount => subAccount.id === subAccountId,
  );
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

  const isTokenTx = isTokenTransaction(transaction);
  const tokenAccount = getAleoSubAccount(account, transaction.subAccountId);

  if (isTokenTx) {
    invariant(tokenAccount, `aleo: token account is missing (${transaction.subAccountId})`);
  }

  // private native/token transfer: sum selected amount records
  if (isPrivateTransaction(transaction)) {
    return transaction.properties.amountRecordCommitments.reduce((sum, commitment) => {
      const record = getRecordByCommitment({
        account,
        commitment,
        ...(isTokenTx && tokenAccount && { tokenAccount }),
      });

      return record ? sum.plus(record.microcredits) : sum;
    }, new BigNumber(0));
  }

  // public token transfer: full transparent token balance as fees are paid with native ALEO
  if (isTokenTx) {
    return tokenAccount?.transparentBalance ?? new BigNumber(0);
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
  const totalSpent = isTokenTransaction(transaction) ? amount : amount.plus(estimatedFees);

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
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC:
      return "private";
    default:
      return "public";
  }
}

export function isPublicTokenTransaction(transaction: Pick<Transaction, "mode">): boolean {
  return (
    transaction.mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
  );
}

export function isPrivateTokenTransaction(transaction: Pick<Transaction, "mode">): boolean {
  return (
    transaction.mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
  );
}

export function isTokenTransaction(transaction: Pick<Transaction, "mode">): boolean {
  return isPublicTokenTransaction(transaction) || isPrivateTokenTransaction(transaction);
}

export function isSelfTransferTransaction(
  transaction: Transaction,
): transaction is TransactionSelfTransfer {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
  );
}

export function isPublicTransaction(transaction: Transaction): transaction is TransactionPublic {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC ||
    isPublicTokenTransaction(transaction)
  );
}

export function isPrivateTransaction(transaction: Transaction): transaction is TransactionPrivate {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    isPrivateTokenTransaction(transaction)
  );
}

/**
 * Workaround for useBridgeTransaction.setAccount preserving the previous mode and only patching subAccountId.
 * Switching between main/sub-account can leave a native mode on a token tx (or vice versa).
 */
export function derivePublicTransactionMode({
  isTokenTx,
  isSelfTransfer,
}: {
  isTokenTx: boolean;
  isSelfTransfer: boolean;
}): Exclude<
  TransactionPublic["mode"],
  | typeof TRANSACTION_TYPE.BOND_PUBLIC
  | typeof TRANSACTION_TYPE.UNBOND_PUBLIC
  | typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC
> {
  if (isTokenTx) {
    return isSelfTransfer
      ? TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
      : TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC;
  }

  return isSelfTransfer
    ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
    : TRANSACTION_TYPE.TRANSFER_PUBLIC;
}

export function derivePrivateTransactionMode({
  isTokenTx,
  isSelfTransfer,
}: {
  isTokenTx: boolean;
  isSelfTransfer: boolean;
}): TransactionPrivate["mode"] {
  if (isTokenTx) {
    return isSelfTransfer
      ? TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
      : TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE;
  }

  return isSelfTransfer
    ? TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
    : TRANSACTION_TYPE.TRANSFER_PRIVATE;
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
  const isTokenTx = isTokenTransaction({ mode: transactionType });
  const maxRecords = isTokenTx
    ? MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION
    : MAX_PRIVATE_RECORDS_PER_TRANSACTION;

  invariant(recordsCount > 0, `aleo: at least one record is required for ${transactionType}`);
  invariant(
    recordsCount <= maxRecords,
    `aleo: too many records for ${transactionType} (max: ${maxRecords})`,
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
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      return {
        type: "transfer_token_public",
        amount,
        to,
        program_id: txIntent.data.programId,
      };
    }
    case TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      return {
        type: "transfer_token_public_to_private",
        amount,
        to,
        program_id: txIntent.data.programId,
      };
    }
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      const records = txIntent.data.records;
      validateRecordsCount(type, records.length);

      if (records.length === 1) {
        return {
          type: "transfer_token_private",
          amount,
          to,
          record: records[0],
          program_id: txIntent.data.programId,
        };
      }

      return {
        type: `transfer_token_private_${records.length}`,
        amount,
        to,
        records,
        program_id: txIntent.data.programId,
      };
    }
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      const records = txIntent.data.records;
      validateRecordsCount(type, records.length);

      if (records.length === 1) {
        return {
          type: "transfer_token_private_to_public",
          amount,
          to,
          record: records[0],
          program_id: txIntent.data.programId,
        };
      }

      return {
        type: `transfer_token_private_to_public_${records.length}`,
        amount,
        to,
        records,
        program_id: txIntent.data.programId,
      };
    }
    case TRANSACTION_TYPE.BOND_PUBLIC: {
      invariant(hasSpecificIntentData(txIntent, type), `aleo: intent data is required for ${type}`);
      return {
        type: "bond_public",
        amount,
        validator: to,
        withdrawal: txIntent.data.withdrawal,
      };
    }
    case TRANSACTION_TYPE.UNBOND_PUBLIC: {
      return {
        type: "unbond_public",
        amount,
        staker: to,
      };
    }
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC: {
      return {
        type: "claim_unbond_public",
        staker: to,
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
  const tokenSubAccount = getAleoSubAccount(account, transaction.subAccountId);

  switch (transaction.mode) {
    // spending public native balance
    case TRANSACTION_TYPE.TRANSFER_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE:
    case TRANSACTION_TYPE.BOND_PUBLIC:
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return account.aleoResources?.transparentBalance ?? new BigNumber(0);
    // spending private native balance
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
    // spending public token balance
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE: {
      return tokenSubAccount?.transparentBalance ?? new BigNumber(0);
    }
    // spending private token balance
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC: {
      const unspentPrivateTokenRecords = tokenSubAccount?.unspentPrivateRecords ?? [];

      return sumPrivateRecords(
        selectPrivateRecordsForAmount({
          unspentRecords: unspentPrivateTokenRecords,
          targetAmount: null,
          maxRecords: MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
        }),
      );
    }
    default:
      // @ts-expect-error - runtime check to ensure all transaction types are handled
      throw new Error(`aleo: unsupported tx mode for balance calculation: ${transaction.mode}`);
  }
}

function resolveDecryptedAmountRecordsFromCommitments({
  type,
  commitments,
  maxRecords,
  findRecord,
}: {
  type: "native" | "token";
  commitments: string[];
  maxRecords: number;
  findRecord: (commitment: string) => AleoUnspentRecord | null;
}): AleoUnspentRecord["decryptedData"][] {
  const label = type === "native" ? "amount records" : "token amount records";

  invariant(commitments.length > 0, "aleo: missing amount record commitments");
  invariant(
    commitments.length <= maxRecords,
    `aleo: too many ${label} selected (max: ${maxRecords})`,
  );

  const missingCommitments: string[] = [];
  const decryptedRecords: AleoUnspentRecord["decryptedData"][] = [];

  for (const commitment of commitments) {
    const record = findRecord(commitment);
    if (record) {
      decryptedRecords.push(record.decryptedData);
    } else {
      missingCommitments.push(commitment);
    }
  }

  invariant(
    missingCommitments.length === 0,
    `aleo: no ${label} found for given commitments: ${missingCommitments.join(", ")}`,
  );

  return decryptedRecords;
}

function buildTransactionIntentBase(
  account: AleoAccount,
  transaction: Transaction,
): Pick<
  AleoTransactionIntent,
  "intentType" | "amount" | "asset" | "recipient" | "sender" | "type" | "useAllAmount"
> {
  return {
    intentType: "transaction",
    amount: BigInt(transaction.amount.toString()),
    asset: { type: "native" },
    recipient: transaction.recipient,
    sender: account.freshAddress,
    type: transaction.mode,
    ...(transaction.useAllAmount && { useAllAmount: true }),
  };
}

function getRequiredTokenProgramId(
  account: AleoAccount,
  subAccountId: string | null | undefined,
): string {
  const tokenAccount = getAleoSubAccount(account, subAccountId);
  invariant(tokenAccount, `aleo: token account is missing (${subAccountId})`);

  return tokenAccount.token.contractAddress;
}

export function createTransactionIntent({
  account,
  transaction,
}: {
  account: AleoAccount;
  transaction: Transaction;
}): AleoTransactionIntent {
  const base = buildTransactionIntentBase(account, transaction);

  switch (transaction.mode) {
    case TRANSACTION_TYPE.TRANSFER_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE:
      return base;

    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
      return {
        ...base,
        data: {
          type: transaction.mode,
          records: resolveDecryptedAmountRecordsFromCommitments({
            type: "native",
            commitments: transaction.properties.amountRecordCommitments,
            maxRecords: MAX_PRIVATE_RECORDS_PER_TRANSACTION,
            findRecord: commitment => getRecordByCommitment({ account, commitment }),
          }),
        },
      };

    case TRANSACTION_TYPE.BOND_PUBLIC:
      return {
        ...base,
        data: {
          type: TRANSACTION_TYPE.BOND_PUBLIC,
          withdrawal: transaction.withdrawal,
        },
      };

    case TRANSACTION_TYPE.UNBOND_PUBLIC:
      return {
        ...base,
        data: { type: TRANSACTION_TYPE.UNBOND_PUBLIC },
      };

    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return {
        ...base,
        data: { type: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC },
      };

    case TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE:
      return {
        ...base,
        data: {
          type: transaction.mode,
          programId: getRequiredTokenProgramId(account, transaction.subAccountId),
        },
      };

    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC: {
      const tokenAccount = getAleoSubAccount(account, transaction.subAccountId);
      invariant(tokenAccount, `aleo: token account is missing (${transaction.subAccountId})`);

      return {
        ...base,
        data: {
          type: transaction.mode,
          programId: tokenAccount.token.contractAddress,
          records: resolveDecryptedAmountRecordsFromCommitments({
            type: "token",
            commitments: transaction.properties.amountRecordCommitments,
            maxRecords: MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
            findRecord: commitment => getRecordByCommitment({ account, commitment, tokenAccount }),
          }),
        },
      };
    }

    default:
      // @ts-expect-error - runtime check to ensure all transaction types are handled
      throw new Error(`aleo: unsupported tx mode for transaction intent: ${transaction.mode}`);
  }
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
  tokenAccount,
}: {
  account: AleoAccount;
  commitment: string;
  tokenAccount?: AleoTokenAccount;
}): AleoUnspentRecord | null {
  const records = tokenAccount
    ? (tokenAccount.unspentPrivateRecords ?? [])
    : (account.aleoResources?.unspentPrivateRecords ?? []);

  return records.find(record => record.commitment === commitment) ?? null;
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
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC:
      return "transfer_token_public";
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
      return "transfer_token_private";
    case TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE:
      return "transfer_token_public_to_private";
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC:
      return "transfer_token_private_to_public";
    case TRANSACTION_TYPE.BOND_PUBLIC:
      return "bond_public";
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
      return "unbond_public";
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return "claim_unbond_public";
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
 * - If `targetAmount` is `null`, returns the top `maxRecords` records by value (useAllAmount mode).
 * - If `targetAmount` is provided and positive:
 *   1. Prefer the **smallest single record** that alone covers the target (fewest records, least overshoot).
 *   2. Otherwise accumulate the **largest records first** until the running total meets the target or `maxRecords` is exhausted.
 *
 * Returns `[]` when the target cannot be covered — either because total funds are insufficient
 * or the record cap is exhausted before the running total reaches the target.
 */
export function selectPrivateRecordsForAmount({
  unspentRecords,
  targetAmount,
  maxRecords = MAX_PRIVATE_RECORDS_PER_TRANSACTION,
}: {
  unspentRecords: AleoUnspentRecord[];
  targetAmount: BigNumber | null;
  maxRecords?: number;
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
    return rankedRecords.slice(0, maxRecords).map(({ record }) => record);
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
    if (selected.length >= maxRecords) {
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

/** CAL lookup by Aleo program name (contract address). Missing programs are omitted. */
export async function getCalTokens({
  currencyId,
  programNames,
}: {
  currencyId: string;
  programNames: string[];
}): Promise<Map<string, TokenCurrency>> {
  const calTokens = new Map<string, TokenCurrency>();
  const uniqueProgramNames = [...new Set(programNames)];

  await promiseAllBatched(4, uniqueProgramNames, async programName => {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      programName,
      currencyId,
    );

    if (token) {
      calTokens.set(programName, token);
    }
  });

  return calTokens;
}

export function isAleoAddressPlaintext(v: string): boolean {
  return normalizeAleoPlaintext(v).toLowerCase().startsWith("aleo1");
}

export function isAleoAmountPlaintext(v: string): boolean {
  return /^\d+u\d+$/.test(normalizeAleoPlaintext(v));
}
