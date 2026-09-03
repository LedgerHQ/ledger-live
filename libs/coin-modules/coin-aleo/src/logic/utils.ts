import BigNumber from "bignumber.js";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import { findCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type {
  Account,
  AccountLike,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationType,
  TokenAccount,
} from "@ledgerhq/types-live";
import type {
  AssetInfo,
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
import aleoConfig from "../config";
import {
  ANNUAL_INFLATION_RATE,
  BALANCED_PRIVATE_RECORDS_PER_TRANSACTION,
  EXPLORER_TRANSFER_TYPES,
  FAST_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  MAX_VALIDATOR_STAKE_SHARE,
  MICROCREDITS_PER_CREDIT,
  MIN_DELEGATOR_STAKE_MICROCREDITS,
  PRIVATE_TRANSFER_FUNCTIONS,
  PROGRAM_ID,
  SINGLE_CALL_SIGNING_TIME,
  STAKING_OPERATION_TYPE,
  TOKEN_RECORD_NAME,
  TRANSACTION_TYPE,
} from "../constants";
import type {
  AleoOperation,
  AleoTransactionType,
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
  AleoOperationExtraRaw,
  TransactionPublic,
  TransactionPrivate,
  AleoCoinConfig,
  AleoPrivateRecord,
  FeeConfiguration,
  AleoUnspentRecord,
  AleoTransactionIntent,
  SigningStrategy,
  StrategyConfig,
  AleoContext,
  AleoTokenDetails,
  AleoTokenType,
  EnrichedPrivateRecord,
  AleoStakingPosition,
  AleoValidatorNonEarningReason,
} from "../types";

const MICROCREDITS_REGEX = /^(\d+)u\d+$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

const VALIDATOR_FIELD_REGEX = /validator:\s*(aleo1[0-9a-z]+)/;
const MICROCREDITS_FIELD_REGEX = /microcredits:\s*(\d+u64)/;
const HEIGHT_FIELD_REGEX = /height:\s*(\d+)u32/;
const ADDRESS_PLAINTEXT_REGEX = /^(aleo1[0-9a-z]+)$/;

function parseBondedMapping(raw: string): { validator: string; microcredits: BigNumber } | null {
  const validator = VALIDATOR_FIELD_REGEX.exec(raw)?.[1];
  const microcredits = MICROCREDITS_FIELD_REGEX.exec(raw)?.[1];
  if (!validator || !microcredits) return null;

  return { validator, microcredits: parseAmount(microcredits) };
}

function parseUnbondingMapping(raw: string): { microcredits: BigNumber; height: number } | null {
  const microcredits = MICROCREDITS_FIELD_REGEX.exec(raw)?.[1];
  const height = HEIGHT_FIELD_REGEX.exec(raw)?.[1];
  if (!microcredits || !height) return null;

  return { microcredits: parseAmount(microcredits), height: Number(height) };
}

function parseWithdrawMapping(raw: string): string | null {
  return ADDRESS_PLAINTEXT_REGEX.exec(normalizeAleoPlaintext(raw))?.[1] ?? null;
}

function parseStakingMapping<T>(
  mapping: string,
  raw: string | null,
  parse: (raw: string) => T | null,
): T | null {
  // `res.data` is an unchecked cast, so treat any empty value as "no entry" rather than
  // trusting the declared `string | null` — the node answers 200 + JSON null for that case.
  if (!raw) return null;

  const parsed = parse(raw);
  if (parsed === null) {
    log("aleo/stakingPosition", `unparseable ${mapping} mapping value`, { raw });
    throw new Error(`aleo: unparseable ${mapping} mapping value`);
  }

  return parsed;
}

export function toStakingPosition({
  bondedRaw,
  unbondingRaw,
  withdrawRaw,
}: {
  bondedRaw: string | null;
  unbondingRaw: string | null;
  withdrawRaw: string | null;
}): AleoStakingPosition {
  const bonded = parseStakingMapping("bonded", bondedRaw, parseBondedMapping);
  const unbonding = parseStakingMapping("unbonding", unbondingRaw, parseUnbondingMapping);

  return {
    bondedBalance: bonded?.microcredits ?? new BigNumber(0),
    bondedValidator: bonded?.validator ?? null,
    unbondingBalance: unbonding?.microcredits ?? new BigNumber(0),
    unbondingHeight: unbonding?.height ?? null,
    withdrawalAddress: parseStakingMapping("withdraw", withdrawRaw, parseWithdrawMapping),
  };
}

export function isTokenRecord(record: AleoPrivateRecord): boolean {
  return (
    record.record_name.toLowerCase() === TOKEN_RECORD_NAME.toLowerCase() &&
    record.program_name !== PROGRAM_ID.CREDITS
  );
}

export function classifyAleoTokenType(token: AleoTokenDetails): AleoTokenType {
  if (token.token_standard?.toLowerCase() === "arc-20") return "arc20";
  if (token.program_name === PROGRAM_ID.TOKEN_REGISTRY) return "arc21";
  if (token.program_name.includes("stablecoin")) return "arc22";
  return "unknown";
}

export function resolvePrivacyContext(context: AleoContext): {
  provableId: string;
  viewKey: string;
} {
  invariant(typeof context.provableId === "string", "aleo: provableId is missing");
  invariant(typeof context.viewKey === "string", "aleo: viewKey is missing");

  return {
    provableId: context.provableId,
    viewKey: context.viewKey,
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

export const getStakingOperationType = (functionId: string): OperationType | undefined =>
  Object.hasOwn(STAKING_OPERATION_TYPE, functionId)
    ? STAKING_OPERATION_TYPE[functionId]
    : undefined;

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

export function resolveTransactionAmount(rawTx: AleoPublicTransaction): BigNumber {
  return new BigNumber(rawTx.amount_u128 ?? rawTx.amount);
}

export function hasPublicAddress(rawTx: AleoPublicTransaction): boolean {
  return Boolean(rawTx.sender_address || rawTx.recipient_address);
}

/** Explorer and scanner both timestamp blocks in seconds. */
export function toBlockDate(blockTimestamp: string | number): Date {
  return new Date(Number(blockTimestamp) * 1000);
}

export function parseTransactionFields(rawTx: AleoPublicTransaction, address: string) {
  const date = toBlockDate(rawTx.block_timestamp);
  const hasFailed = rawTx.transaction_status !== "Accepted";
  let type: OperationType = "NONE";
  const fee = rawTx.fee;
  const blockHash = rawTx.block_hash;

  if (rawTx.program_id === PROGRAM_ID.CREDITS) {
    type = address === rawTx.recipient_address ? "IN" : "OUT";
    const stakingType = getStakingOperationType(rawTx.function_id);
    if (stakingType) type = stakingType;
  }

  const transactionType = determineTransactionType(rawTx.function_id, type);

  return { type, fee, blockHash, transactionType, date, hasFailed };
}

/**
 * A program is only a token of a given standard because the token registry says so — nothing in the
 * program id tells them apart, so a program the registry does not list stays "unknown".
 */
function toOperationAsset(
  programId: string,
  tokenTypeByProgramName: ReadonlyMap<string, AleoTokenType>,
): AssetInfo {
  return programId === PROGRAM_ID.CREDITS
    ? { type: "native" }
    : { type: tokenTypeByProgramName.get(programId) ?? "unknown", assetReference: programId };
}

/** Staking calls only exist on credits.aleo, so the function id alone cannot type one. */
function resolveStakingOperationType(rawTx: AleoPublicTransaction): OperationType | undefined {
  return rawTx.program_id === PROGRAM_ID.CREDITS
    ? getStakingOperationType(rawTx.function_id)
    : undefined;
}

function isBlankSenderValue(sender: string | null | undefined): boolean {
  return !sender;
}

/**
 * The indexer blanks `sender_address` on staking calls (bond_public/unbond_public/
 * claim_unbond_public), unlike transfers. Those functions can only appear in an account's history
 * when that account is the staker itself, so — just like `hasOwnedRecord` for a private side — the
 * blank side is the account's own address rather than a genuinely unknown one.
 */
function resolveSenderAddress(
  rawTx: AleoPublicTransaction,
  address: string,
  hasOwnedRecord: boolean,
): string {
  if (!isBlankSenderValue(rawTx.sender_address)) return rawTx.sender_address;
  if (hasOwnedRecord || resolveStakingOperationType(rawTx) !== undefined) return address;

  return rawTx.sender_address;
}

/**
 * Incremental sync only refetches transactions above the previous sync's cursor, so a staking
 * op cached before the resolveSenderAddress fallback existed (blank sender_address) never gets
 * refetched and stays blank forever. Backfill it in place from the already-cached operations
 * instead of relying on a full resync.
 *
 * This is a one-time cache repair: callers should gate it on a persisted per-account flag
 * (see `hasBackfilledStakingSenders` in bridge/sync.ts) rather than invoking it on every sync.
 */
export function backfillStakingSenders(ops: AleoOperation[], address: string): AleoOperation[] {
  return ops.map(op => {
    const functionId = op.extra?.functionId;
    const hasBlankSender = op.senders.every(isBlankSenderValue);
    if (!hasBlankSender || !functionId || getStakingOperationType(functionId) === undefined) {
      return op;
    }
    return { ...op, senders: [address] };
  });
}

/**
 * `sender`/`recipient` are the addresses after a blank side was substituted with the account's own;
 * `rawTx` still shows which sides the explorer actually published.
 *
 * A token transfer is typed IN/OUT here, where `parseTransactionFields` (still used by the classic
 * bridge) returns NONE: the framework operation carries the program as its asset, so there is
 * nothing left for NONE to guard.
 */
function resolveOperationType(
  rawTx: AleoPublicTransaction,
  address: string,
  sender: string,
  recipient: string,
): OperationType {
  if (rawTx.sender_address === address && rawTx.recipient_address === address) return "IN";
  if (sender === address) return "OUT";
  if (recipient === address) return "IN";

  return "NONE";
}

/**
 * The account's own view of a public transaction, merged with what its private records reveal.
 *
 * `hasOwnedRecord` means a record the account owns shares this transaction, so an address the
 * explorer left blank is the account's own private side.
 *
 * `resolvedRecipient` is the third-party recipient of a shield read back from the transition inputs
 * (see resolveThirdPartyShieldRecipients) — the explorer blanks it and no owned record can stand in
 * for it.
 */
export const toPublicOperation = ({
  rawTx,
  address,
  hasOwnedRecord,
  tokenTypeByProgramName,
  resolvedRecipient,
}: {
  rawTx: AleoPublicTransaction;
  address: string;
  hasOwnedRecord: boolean;
  tokenTypeByProgramName: ReadonlyMap<string, AleoTokenType>;
  resolvedRecipient?: string;
}): CoinFrameworkOperation => {
  const hash = rawTx.transaction_id.trim();
  const date = toBlockDate(rawTx.block_timestamp);
  const stakingType = resolveStakingOperationType(rawTx);
  const sender = resolveSenderAddress(rawTx, address, hasOwnedRecord);
  const recipient =
    !rawTx.recipient_address && hasOwnedRecord
      ? address
      : rawTx.recipient_address || (resolvedRecipient ?? "");
  const type = stakingType ?? resolveOperationType(rawTx, address, sender, recipient);
  // Bonding and unbonding move funds between the account's own balances, so the only value that
  // actually leaves the account is the fee.
  const value = stakingType ? new BigNumber(rawTx.fee) : resolveTransactionAmount(rawTx);

  return {
    id: hash,
    type,
    senders: [sender],
    recipients: [recipient],
    value: BigInt(value.toFixed(0)),
    asset: toOperationAsset(rawTx.program_id, tokenTypeByProgramName),
    details: {
      functionId: rawTx.function_id,
      transactionType: determineTransactionType(rawTx.function_id, type),
      ledgerOpType: type,
    },
    tx: {
      hash,
      fees: BigInt(new BigNumber(rawTx.fee).toFixed(0)),
      date,
      block: {
        hash: rawTx.block_hash,
        height: rawTx.block_number,
        time: date,
      },
      failed: rawTx.transaction_status !== "Accepted",
    },
  };
};

export const toPrivateOperation = (
  enrichedRecord: EnrichedPrivateRecord,
  address: string,
  tokenTypeByProgramName: ReadonlyMap<string, AleoTokenType>,
): CoinFrameworkOperation => {
  const { rawRecord, details } = enrichedRecord;
  const hash = rawRecord.transaction_id.trim();
  const date = toBlockDate(rawRecord.block_timestamp);
  const type: OperationType = enrichedRecord.recipient === address ? "IN" : "OUT";

  return {
    id: hash,
    type,
    senders: [enrichedRecord.sender],
    recipients: [enrichedRecord.recipient],
    value: BigInt(enrichedRecord.value.toFixed(0)),
    asset: toOperationAsset(rawRecord.program_name, tokenTypeByProgramName),
    details: {
      functionId: rawRecord.function_name,
      transactionType: "private",
      ledgerOpType: type,
    },
    tx: {
      hash,
      fees: BigInt(new BigNumber(details.fee_value).toFixed(0)),
      date,
      block: {
        hash: details.block_hash,
        height: rawRecord.block_height,
        time: date,
      },
      failed: details.status !== "Accepted",
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

export function buildFeeConfigurationForRootIntent({
  isPrivate,
  maxBaseFee,
  maxPriorityFee,
}: {
  isPrivate: boolean;
  maxBaseFee: bigint;
  maxPriorityFee: bigint;
}): FeeConfiguration {
  return {
    function_name: isPrivate ? "fee_private" : "fee_public",
    max_base_fee: maxBaseFee.toString(),
    max_priority_fee: maxPriorityFee.toString(),
  };
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

  // unbonding spends the bonded position; the fee is paid from the transparent balance
  if (transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC) {
    return account.aleoResources?.bondedBalance ?? new BigNumber(0);
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

export function isPrivateDestination(transaction: Transaction): boolean {
  return (
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
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

/** `functionId` works as the discriminant because no other family's extra carries one. */
export function isAleoOperationExtra(extra: OperationExtra): extra is AleoOperationExtra {
  return extra !== null && typeof extra === "object" && "functionId" in extra;
}

export function isAleoOperationExtraRaw(
  extraRaw: OperationExtraRaw,
): extraRaw is AleoOperationExtraRaw {
  return extraRaw !== null && typeof extraRaw === "object" && "functionId" in extraRaw;
}

function isPrivateOperation(operation: Operation): boolean {
  const { extra } = operation;
  return isRecord(extra) && "transactionType" in extra && extra.transactionType === "private";
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
 * Unbonded funds become claimable once the chain reaches the height stored in the
 * credits.aleo `unbonding` mapping. Uses the account's last synced blockHeight.
 */
export function getClaimableStakingBalance(account: AleoAccount): BigNumber {
  const { unbondingBalance, unbondingHeight } = account.aleoResources ?? {};
  if (!unbondingBalance || unbondingHeight === null || unbondingHeight === undefined)
    return new BigNumber(0);
  return account.blockHeight >= unbondingHeight ? unbondingBalance : new BigNumber(0);
}

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
      return account.aleoResources?.transparentBalance ?? new BigNumber(0);
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
      return account.aleoResources?.bondedBalance ?? new BigNumber(0);
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return getClaimableStakingBalance(account);
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
  tokenAccount: AleoTokenAccount | undefined,
): Pick<
  AleoTransactionIntent,
  "intentType" | "amount" | "asset" | "recipient" | "sender" | "type" | "useAllAmount"
> {
  return {
    intentType: "transaction",
    amount: BigInt(transaction.amount.toString()),
    asset: tokenAccount
      ? {
          type: tokenAccount.token.tokenType,
          assetReference: tokenAccount.token.contractAddress,
          name: tokenAccount.token.name,
          unit: tokenAccount.token.units[0],
        }
      : { type: "native" },
    recipient: transaction.recipient,
    sender: account.freshAddress,
    type: transaction.mode,
    ...(transaction.useAllAmount && { useAllAmount: true }),
  };
}

export function createTransactionIntent({
  account,
  transaction,
  tvks = [],
}: {
  account: AleoAccount;
  transaction: Transaction;
  tvks?: string[];
}): AleoTransactionIntent {
  const tokenAccount = isTokenTransaction(transaction)
    ? getAleoSubAccount(account, transaction.subAccountId)
    : undefined;
  const base = buildTransactionIntentBase(account, transaction, tokenAccount);

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
          tvks,
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
      invariant(tokenAccount, `aleo: token account is missing (${transaction.subAccountId})`);

      return {
        ...base,
        data: {
          type: transaction.mode,
          programId: tokenAccount.token.contractAddress,
        },
      };

    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC: {
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
          tvks,
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

export function getMaxPrivateRecordsForAccount(account: AleoAccount | AleoTokenAccount): number {
  return account.type === "TokenAccount"
    ? MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION
    : MAX_PRIVATE_RECORDS_PER_TRANSACTION;
}

export function getStrategyConfig(
  account: AleoAccount | AleoTokenAccount,
): Record<SigningStrategy, StrategyConfig> {
  const maxRecords = getMaxPrivateRecordsForAccount(account);

  return {
    fast: { min: 1, max: FAST_PRIVATE_RECORDS_PER_TRANSACTION },
    balanced: {
      min: FAST_PRIVATE_RECORDS_PER_TRANSACTION + 1,
      max: BALANCED_PRIVATE_RECORDS_PER_TRANSACTION,
    },
    full: {
      min: BALANCED_PRIVATE_RECORDS_PER_TRANSACTION + 1,
      max: maxRecords,
    },
  };
}

export function isAleoAccount(acc: AccountLike): acc is AleoAccount | AleoTokenAccount {
  if (acc.type === "Account") {
    return acc.currency.family === "aleo";
  }
  return findCryptoCurrencyById(acc.token.parentCurrencyId)?.family === "aleo";
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

/** Narrows any cross-family transaction shape down to Aleo's own `Transaction` type. */
export function isAleoTransaction(tx: { family: string }): tx is Transaction {
  return tx.family === "aleo";
}

export function isAleoAddressPlaintext(v: string): boolean {
  return normalizeAleoPlaintext(v).toLowerCase().startsWith("aleo1");
}

export function isAleoAmountPlaintext(v: string): boolean {
  return /^\d+u\d+$/.test(normalizeAleoPlaintext(v));
}

/**
 * Ledger's batching wrappers suffix the wrapped function with the record count
 * (transfer_private_2, transfer_public_to_private_4), so an exact name match misses them.
 */
export function stripBatcherSuffix(functionName: string): string {
  return functionName.replace(/_\d+$/, "");
}

/**
 * Whether a transition's (recipient, amount) arguments can be located by scanning for the first
 * address-shaped argument. A batching wrapper keeps the wrapped function's argument order.
 *
 * Excludes transfer_from_*, whose first address argument is the sender, not the recipient.
 */
export function isParsableTransferFunction(functionName: string): boolean {
  return PRIVATE_TRANSFER_FUNCTIONS.has(stripBatcherSuffix(functionName));
}

/**
 * Takes a transfer transition's arguments in order (null where undecryptable or not a value) and
 * returns the first address-shaped one plus the first amount-shaped one after it.
 *
 * No fixed offset works — all three argument layouts are deployed:
 *   credits.aleo, ARC-20   (record, recipient, amount)
 *   ARC-21, ARC-22         (recipient, amount, record, …)
 *   token_registry.aleo    (token_id, recipient, amount, flag) for transfer_public_to_private
 */
export function findTransferArguments(plaintexts: (string | null)[]): {
  recipient: string;
  amount: string;
} | null {
  let recipient: string | null = null;

  for (const plaintext of plaintexts) {
    if (!plaintext) {
      continue;
    }

    if (!recipient) {
      if (isAleoAddressPlaintext(plaintext)) {
        recipient = normalizeAleoPlaintext(plaintext);
      }

      continue;
    }

    if (isAleoAmountPlaintext(plaintext)) {
      return {
        recipient,
        amount: normalizeAleoPlaintext(plaintext),
      };
    }
  }

  return null;
}

/** `latest/totalSupply` is untrusted JSON: a bare scalar, in **credits**. */
export function parseTotalSupply(value: unknown): BigNumber | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = new BigNumber(value);

  return parsed.isFinite() && parsed.isGreaterThan(0) ? parsed : null;
}

/**
 * The network-wide gross staking rate before any validator commission, as a fraction
 * (0.078 = 7.8%), or null when the inputs cannot yield one.
 *
 * Derived from the delegator's `block_reward * stake / total_stake` share in snarkVM
 * (synthesizer/src/vm/helpers/rewards.rs).
 */
export function estimateGrossRate(
  totalSupplyCredits: BigNumber,
  totalStakeMicrocredits: BigNumber,
): BigNumber | null {
  if (!totalSupplyCredits.isFinite() || totalSupplyCredits.isLessThanOrEqualTo(0)) return null;
  if (!totalStakeMicrocredits.isFinite() || totalStakeMicrocredits.isLessThanOrEqualTo(0)) {
    return null;
  }

  const totalStakeCredits = totalStakeMicrocredits.dividedBy(MICROCREDITS_PER_CREDIT);

  return totalSupplyCredits.multipliedBy(ANNUAL_INFLATION_RATE).dividedBy(totalStakeCredits);
}

/**
 * What a delegator can expect from one validator: the gross network rate less that
 * validator's commission, as a fraction (0.07 = 7%). A **lower bound** — every surface
 * showing it must label it an estimate.
 *
 * Null means "cannot be derived", zero means "earns nothing"; not interchangeable.
 */
/**
 * Why a validator pays its delegators nothing, or null when it pays. The single source
 * of truth for these rules: {@link estimateNetRate} collapses all of them to a rate of
 * exactly 0, so anything wanting to say *which* must ask here rather than infer.
 */
export function getValidatorNonEarningReason({
  totalStakeMicrocredits,
  validatorStakeMicrocredits,
  commissionPercent,
}: {
  totalStakeMicrocredits: BigNumber;
  validatorStakeMicrocredits: BigNumber;
  commissionPercent: BigNumber;
}): AleoValidatorNonEarningReason | null {
  if (
    validatorStakeMicrocredits
      .dividedBy(totalStakeMicrocredits)
      .isGreaterThan(MAX_VALIDATOR_STAKE_SHARE)
  ) {
    return "overConcentrated";
  }
  if (commissionPercent.isGreaterThanOrEqualTo(100)) return "fullCommission";

  return null;
}

export function estimateNetRate({
  totalSupplyCredits,
  totalStakeMicrocredits,
  validatorStakeMicrocredits,
  commissionPercent,
  delegatorStakeMicrocredits,
}: {
  totalSupplyCredits: BigNumber;
  totalStakeMicrocredits: BigNumber;
  validatorStakeMicrocredits: BigNumber;
  commissionPercent: BigNumber;
  /** The delegator's own position. Omit for the generic rate a picker shows. */
  delegatorStakeMicrocredits?: BigNumber;
}): BigNumber | null {
  const grossRate = estimateGrossRate(totalSupplyCredits, totalStakeMicrocredits);
  if (grossRate === null) return null;

  if (!commissionPercent.isFinite() || commissionPercent.isLessThan(0)) return null;

  const delegatorBelowMinimum =
    delegatorStakeMicrocredits !== undefined &&
    delegatorStakeMicrocredits.isLessThan(MIN_DELEGATOR_STAKE_MICROCREDITS);
  const nonEarningReason = getValidatorNonEarningReason({
    totalStakeMicrocredits,
    validatorStakeMicrocredits,
    commissionPercent,
  });
  if (delegatorBelowMinimum || nonEarningReason !== null) return new BigNumber(0);

  const keptShare = new BigNumber(1).minus(commissionPercent.dividedBy(100));

  return grossRate.multipliedBy(keptShare);
}
