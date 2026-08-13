import {
  encodeOperationId,
  OPERATION_TYPE_OUT_FAMILY,
  OPERATION_TYPE_STAKE_FAMILY,
} from "@ledgerhq/ledger-wallet-framework/operation";
import type {
  Account,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationType,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-module-framework/utils";
import type {
  AssetInfo,
  Balance,
  Operation as CoreOperation,
  FeeEstimation,
  StakingOperation,
  TransactionIntent,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  FeeData,
  FeeDataRaw,
  GasOptions,
  GasOptionsRaw,
  GenericTransaction,
  GenericTransactionRaw,
  JsonSafe,
  JsonSafeRecord,
  OperationCommon,
} from "./types";
import { craftTransactionData as defaultCraftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

type BigNumberToBigIntDeep<T> = T extends BigNumber
  ? bigint
  : T extends Array<infer U>
    ? Array<BigNumberToBigIntDeep<U>>
    : T extends object
      ? { [K in keyof T]: BigNumberToBigIntDeep<Exclude<T[K], undefined>> }
      : T;

export function bigNumberToBigIntDeep<T>(obj: T): BigNumberToBigIntDeep<T> {
  if (BigNumber.isBigNumber(obj)) return BigInt(obj.toFixed()) as BigNumberToBigIntDeep<T>;

  if (Array.isArray(obj)) return obj.map(bigNumberToBigIntDeep) as BigNumberToBigIntDeep<T>;

  if (!!obj && typeof obj === "object")
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, bigNumberToBigIntDeep(value)]),
    ) as BigNumberToBigIntDeep<T>;

  return obj as BigNumberToBigIntDeep<T>;
}

function toJsonSafe(value: unknown): JsonSafe | undefined {
  const json = JSON.stringify(value, jsonSafeReplacer);
  return json === undefined ? undefined : (JSON.parse(json) as JsonSafe);
}

function jsonSafeReplacer(this: Record<string, unknown>, key: string, value: unknown): unknown {
  const raw = this[key];
  if (typeof raw === "bigint") return raw.toString();
  if (BigNumber.isBigNumber(raw)) return raw.toFixed();
  if (typeof value === "bigint") return value.toString();
  return value;
}

/**
 * Normalises a fee-estimation parameter bag into a JSON-safe record for `GenericTransaction.feeParameters`.
 * `bigint`/`BigNumber` values become decimal strings; everything else is carried through. The bag
 * rides on the live transaction, which the swap flow serialises with `JSON.stringify` — storing the
 * estimation's raw `bigint` values there crashed EVM swaps on mobile and stalled them on desktop
 * (LIVE-35482). Returns `undefined` for a missing bag so callers keep clearing stale figures.
 */
export function feeParametersToJsonSafe(
  parameters: Record<string, unknown> | undefined,
): JsonSafeRecord | undefined {
  if (!parameters) return undefined;
  return toJsonSafe(parameters) as JsonSafeRecord;
}

function toFeeDataFromUnknown(value: unknown): FeeData {
  const read = (key: keyof FeeData): BigNumber | null => {
    if (!value || typeof value !== "object" || !(key in value)) return null;
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "bigint") return new BigNumber(raw.toString());
    if (typeof raw === "number") return new BigNumber(raw);
    if (typeof raw === "string") return new BigNumber(raw);
    return null;
  };
  return {
    gasPrice: read("gasPrice"),
    maxFeePerGas: read("maxFeePerGas"),
    maxPriorityFeePerGas: read("maxPriorityFeePerGas"),
    nextBaseFee: read("nextBaseFee"),
  };
}

/**
 * Converts the fee-estimation `gasOptions` (API shape, numeric values as bigint)
 * into the transaction's `GasOptions` shape (BigNumber). Returns `undefined` when
 * the value does not expose the expected slow/medium/fast structure, so families
 * that don't produce gas options are left untouched.
 */
export function toGasOptionsFromUnknown(value: unknown): GasOptions | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("slow" in value) ||
    !("medium" in value) ||
    !("fast" in value)
  ) {
    return undefined;
  }
  const options = value as Record<"slow" | "medium" | "fast", unknown>;
  return {
    slow: toFeeDataFromUnknown(options.slow),
    medium: toFeeDataFromUnknown(options.medium),
    fast: toFeeDataFromUnknown(options.fast),
  };
}

export function findCryptoCurrencyByNetwork(network: string): CryptoCurrency | undefined {
  const networksRemap = {
    xrp: "ripple",
  };
  return findCryptoCurrencyById(networksRemap[network] ?? network);
}

export function extractBalance(balances: Balance[], type: string): Balance {
  return (
    balances.find(balance => balance.asset.type === type) ?? {
      asset: { type },
      value: 0n,
    }
  );
}

// A sponsored (gasless) transaction has its fee paid by a third party, not by the
// account, so the pending fee must not be locked against the native balance.
function isSponsoredOperation(op: Operation): boolean {
  const raw = op.transactionRaw;
  return !!raw && "sponsored" in raw && raw.sponsored === true;
}

/**
 * `pendingOperations` are optimistic and don’t affect `spendableBalance` until the next sync.
 * Lock the native amount already committed by pending ops: fees for any non-sponsored op, plus outgoing value for OUT-family ops. See LIVE-33180.
 */
export function getPendingNativeSpent(pendingOperations: Operation[]): BigNumber {
  return pendingOperations.reduce((spent, op) => {
    const withFee = isSponsoredOperation(op) ? spent : spent.plus(op.fee);
    if (op.type === "FEES") return withFee;
    if (OPERATION_TYPE_OUT_FAMILY.includes(op.type)) return withFee.plus(op.value);

    return withFee;
  }, new BigNumber(0));
}

/**
 * Native spendable balance once funds committed by pending (optimistic, not-yet-synced)
 * operations are removed. `spendableBalance` alone ignores pending ops until the next
 * sync, so send-max computed from it would overestimate while a previous send is pending.
 * This keeps the generic `computeUseAllAmount` path in sync with `validateIntent`
 * (used by `getTransactionStatus`), which already accounts for pending via `extractBalances`.
 */
export function getNativeSpendableAfterPending(account: Account): BigNumber {
  const pendingSpent = getPendingNativeSpent(account.pendingOperations ?? []);
  return BigNumber.max(0, account.spendableBalance.minus(pendingSpent));
}

/**
 * Next transaction sequence (nonce) that accounts for locally-known pending operations.
 *
 * The network sequence source (indexer or a load-balanced RPC) can lag behind a
 * just-broadcast transaction and briefly return an already-used nonce, causing a
 * "nonce too low" on the next send. Taking the max with the highest pending
 * sequence self-corrects once the network source catches up, without waiting for a sync.
 */
export function nextSequenceWithPending(
  pendingOperations: Operation[],
  networkSequence: bigint,
): bigint {
  let highestPending = -1n;
  for (const op of pendingOperations) {
    const rawSequence = op.transactionSequenceNumber;
    // Skip missing or non-integer sequences; `.toFixed()` (not `.toString()`) avoids the
    // exponential notation that BigInt() cannot parse.
    if (!rawSequence?.isInteger()) {
      continue;
    }
    const seq = BigInt(rawSequence.toFixed());
    if (seq > highestPending) highestPending = seq;
  }
  const pendingFloor = highestPending >= 0n ? highestPending + 1n : 0n;
  return networkSequence > pendingFloor ? networkSequence : pendingFloor;
}

// Used for token sub-accounts: lock `op.value` for pending ops that should reduce token spendable.
// This includes OUT-family and STAKE-family types (stake-family is fee-only on native; see getOperationAmountNumber).
function isOutgoingOperation(op: Operation): boolean {
  return (
    OPERATION_TYPE_OUT_FAMILY.includes(op.type) || OPERATION_TYPE_STAKE_FAMILY.includes(op.type)
  );
}

/**
 * Token equivalent of `getPendingNativeSpent`: returns how much of a token
 * sub-account's balance is committed by pending operations. Fees are paid in the
 * native currency, so only the operation `value` matters here. `buildOptimisticOperation`
 * can append any outgoing sub-operation type to a token account (OUT, DELEGATE,
 * STAKE, OPT_IN, ...), so we lock the value of every outgoing op rather than just
 * plain "OUT" sends.
 */
export function getPendingTokenSpent(pendingOperations: Operation[]): BigNumber {
  return pendingOperations.reduce(
    (spent, op) => (isOutgoingOperation(op) ? spent.plus(op.value) : spent),
    new BigNumber(0),
  );
}

export function extractBalances(
  account: Account,
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo,
): Balance[] {
  const nativeReserve = BigNumber.max(account.balance.minus(account.spendableBalance), 0);
  const nativePending = getPendingNativeSpent(account.pendingOperations ?? []);
  const balances: Balance[] = [
    {
      // `value` is the total balance, `locked` is the non-spendable part of it.
      // Consumers must compute available funds as `value - locked`.
      // We lock the chain reserve plus any funds already committed to pending
      // (optimistic, not-yet-synced) transactions, capped at the total balance.
      value: BigInt(account.balance.toFixed()),
      asset: { type: "native" },
      locked: BigInt(BigNumber.min(nativeReserve.plus(nativePending), account.balance).toFixed()),
    },
  ];

  if (!account.subAccounts?.length || !getAssetFromToken) {
    return balances;
  }

  for (const subAccount of account.subAccounts) {
    const asset = getAssetFromToken(subAccount.token, account.freshAddress);
    const tokenReserve = BigNumber.max(subAccount.balance.minus(subAccount.spendableBalance), 0);
    const tokenPending = getPendingTokenSpent(subAccount.pendingOperations ?? []);
    balances.push({
      value: BigInt(subAccount.balance.toFixed()),
      asset,
      locked: BigInt(BigNumber.min(tokenReserve.plus(tokenPending), subAccount.balance).toFixed()),
    });
  }

  return balances;
}

/** Reads a numeric `parameters` field (bigint/number/string) as BigNumber, else `fallback`. */
function numericParam(value: unknown, fallback: bigint): BigNumber {
  return typeof value === "bigint" || typeof value === "number" || typeof value === "string"
    ? new BigNumber(value.toString())
    : new BigNumber(fallback.toString());
}

/** Base fee plus any `additionalFees` from parameters (e.g. EVM L2 data fees). */
function totalFeesFromEstimation(estimation: FeeEstimation): BigNumber {
  return new BigNumber(estimation.value.toString()).plus(
    numericParam(estimation.parameters?.additionalFees, 0n),
  );
}

/**
 * Send-max amount: `parameters.amount` if the coin exposes it (e.g. Tezos), else
 * `spendableBalance - max(reserve, fees)` floored to `amountScale` (both optional, default 0/1).
 */
export function computeUseAllAmount(
  estimation: FeeEstimation,
  spendableBalance: BigNumber,
): BigNumber {
  if (estimation.parameters?.amount !== undefined) {
    return BigNumber.max(0, numericParam(estimation.parameters.amount, 0n));
  }
  const reserve = numericParam(estimation.parameters?.reserve, 0n);
  const scaleParam = numericParam(estimation.parameters?.amountScale, 1n);
  const scale = scaleParam.gt(0) ? scaleParam : new BigNumber(1);
  const effectiveReserve = BigNumber.max(reserve, totalFeesFromEstimation(estimation));
  const raw = BigNumber.max(0, spendableBalance.minus(effectiveReserve));
  return raw.idiv(scale).times(scale);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isDelegationMode(mode: GenericTransaction["mode"]): mode is StakingOperation {
  return (
    typeof mode === "string" &&
    ["delegate", "undelegate", "redelegate", "claimReward", "compoundReward", "withdraw"].includes(
      mode,
    )
  );
}

type GenericCoinFrameworkMemo =
  | { type: string; value?: string }
  | { type: "map"; memos: Map<string, string> };
type GenericCoinFrameworkTxData = { type: string; value?: unknown };
type GenericCoinFrameworkTransactionIntent = TransactionIntent & {
  memo?: GenericCoinFrameworkMemo;
  data?: GenericCoinFrameworkTxData;
  mode?: StakingOperation;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
};

function getDelegationIntentFields(
  delegationMode: StakingOperation | undefined,
  transaction: GenericTransaction,
): Partial<
  Pick<
    GenericCoinFrameworkTransactionIntent,
    "mode" | "valAddress" | "valId" | "dstValAddress" | "withdrawId"
  >
> {
  return {
    ...(delegationMode !== undefined && transaction.valAddress
      ? { mode: delegationMode, valAddress: transaction.valAddress }
      : {}),
    ...(delegationMode !== undefined && transaction.valId
      ? { mode: delegationMode, valId: transaction.valId }
      : {}),
    ...(delegationMode !== undefined && transaction.withdrawId
      ? { withdrawId: transaction.withdrawId }
      : {}),
    ...(delegationMode !== undefined && transaction.dstValAddress
      ? { dstValAddress: transaction.dstValAddress }
      : {}),
  };
}

export function cleanedOperation(operation: OperationCommon): OperationCommon {
  if (!operation.extra) return operation;

  const extraToClean = new Set([
    "assetReference",
    "assetAmount",
    "assetOwner",
    "assetSenders",
    "assetRecipients",
    "parentSenders",
    "parentRecipients",
    "ledgerOpType",
  ]);
  const cleanedExtra = Object.fromEntries(
    Object.entries(operation.extra).filter(([key]) => !extraToClean.has(key)),
  );

  return { ...operation, extra: cleanedExtra };
}

/**
 * The one `details` key a coin module owns outright; its contents are never inspected here. Only this
 * reserved key is forwarded, never every unrecognised `details` key: `Operation.extra` is persisted,
 * so a blanket forward would let a non-JSON value reach storage.
 */
const FAMILY_EXTRA_DETAILS_KEY = "familyExtra";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readFamilyExtra(details: CoreOperation["details"]): JsonSafeRecord | undefined {
  const raw = asRecord(details?.[FAMILY_EXTRA_DETAILS_KEY]);
  return raw ? (toJsonSafe(raw) as JsonSafeRecord) : undefined;
}

/**
 * Every framework-owned `extra` key is a JSON-safe string, string array or boolean except
 * `stake.amount`, a `BigNumber`. These two return **only** that converted key, never the whole bag:
 * `mergeExtra` applies them last, so the framework can serialize its own half
 * (`accountRawAssign.ts`) without a family hook that spreads the input being able to put the
 * unconverted value back.
 *
 * A `stake.amount` that is not the expected type is left alone rather than coerced: it belongs to a
 * shape this layer did not write, and `new BigNumber()` on it would store a NaN over real data.
 */
export function frameworkExtraToRaw(extra: OperationExtra): Record<string, unknown> | undefined {
  const stake = asRecord(asRecord(extra)?.stake);
  if (!stake || !BigNumber.isBigNumber(stake.amount)) return undefined;
  return { stake: { ...stake, amount: stake.amount.toFixed() } };
}

export function frameworkExtraFromRaw(
  extraRaw: OperationExtraRaw,
): Record<string, unknown> | undefined {
  const stake = asRecord(asRecord(extraRaw)?.stake);
  if (!stake || typeof stake.amount !== "string") return undefined;
  return { stake: { ...stake, amount: new BigNumber(stake.amount) } };
}

/**
 * Precedence is per key, not per bag. `passthrough` (the untouched input) carries every key neither
 * side maps, so a family mapping only its own keys cannot drop `ledgerOpType` or `memo`;
 * `frameworkOwned` is applied last, so a hook written as `extra => ({ ...extra, ...ownKeys })`
 * cannot carry an unconverted `stake` back over the framework's conversion.
 *
 * A family hook returning nothing usable leaves the passthrough plus the framework's own keys, rather
 * than handing the serialization layer `undefined` and dropping the whole bag.
 */
export function mergeExtra(
  passthrough: unknown,
  familyPart: unknown,
  frameworkOwned: Record<string, unknown> | undefined,
): unknown {
  const base = asRecord(passthrough);
  const family = asRecord(familyPart);
  if (!base) return family ? { ...family, ...frameworkOwned } : passthrough;
  return { ...base, ...family, ...frameworkOwned };
}

export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
  const opType = op.type as OperationType;

  const extra: {
    assetReference?: string;
    assetOwner?: string;
    assetAmount?: string | undefined;
    assetSenders?: string[];
    assetRecipients?: string[];
    parentSenders?: string[];
    parentRecipients?: string[];
    ledgerOpType?: string | undefined;
    memo?: string | undefined;
    internal?: boolean;
    feePayer?: string;
    stake?: { address: string; amount: BigNumber };
    familyExtra?: JsonSafeRecord;
  } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.details?.assetAmount !== undefined) {
    extra.assetAmount = op.details.assetAmount as string;
  }

  if (isStringArray(op.details?.assetSenders)) {
    extra.assetSenders = op.details?.assetSenders;
  }

  if (isStringArray(op.details?.assetRecipients)) {
    extra.assetRecipients = op.details?.assetRecipients;
  }

  if (isStringArray(op.details?.parentSenders)) {
    extra.parentSenders = op.details?.parentSenders;
  }

  if (isStringArray(op.details?.parentRecipients)) {
    extra.parentRecipients = op.details?.parentRecipients;
  }

  if (op.asset?.type !== "native") {
    extra.assetReference =
      "assetReference" in (op.asset ?? {}) ? (op.asset as any).assetReference : "";
    extra.assetOwner = "assetOwner" in (op.asset ?? {}) ? (op.asset as any).assetOwner : "";
  }
  if (op.details?.memo) {
    extra.memo = op.details.memo as string;
  }

  if (op.details?.internal === true) {
    extra.internal = op.details?.internal;
  }

  if (typeof op.tx.feesPayer === "string") {
    extra.feePayer = op.tx.feesPayer;
  }

  // Nested under one key the family owns rather than flattened beside the framework's. Every key
  // above is written *conditionally*, and `pagingToken` is read but never written here, so a
  // flattened bag would supply the framework's own answer on any operation where the framework
  // wrote neither: a `familyExtra.internal` reroutes a plain transfer into the internal-operations
  // bucket, a `familyExtra.pagingToken` becomes the next sync's cursor.
  const familyExtra = readFamilyExtra(op.details);
  if (familyExtra) {
    extra.familyExtra = familyExtra;
  }

  if (op.details?.stake && typeof op.details.stake === "object") {
    const s = op.details.stake as { address?: string; amount?: bigint };
    extra.stake = {
      address: s.address ?? "",
      amount: new BigNumber(typeof s.amount === "bigint" ? s.amount.toString() : "0"),
    };
  }

  const bnFees = new BigNumber(op.tx.fees.toString());
  const hasFailed = op.tx.failed;

  let value: BigNumber;
  if (hasFailed) {
    value = bnFees;
  } else if (
    op.asset.type === "native" &&
    ["OUT", "FEES", "DELEGATE", "UNDELEGATE", "REDELEGATE"].includes(opType)
  ) {
    value = new BigNumber(op.value.toString()).plus(bnFees);
  } else {
    value = new BigNumber(op.value.toString());
  }

  const res = {
    id: encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: opType,
    value,
    fee: bnFees,
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: extra.parentSenders ?? op.senders,
    recipients: extra.parentRecipients ?? op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence
      ? new BigNumber(op.details?.sequence.toString())
      : undefined,
    hasFailed,
    extra,
  };

  return res;
}

/**
 * Default implementation of `computeIntentType` is a simple whitelist
 * with a fallback to "Payment"
 */
function defaultComputeIntentType(transaction: GenericTransaction): string {
  if (!transaction.mode) return "Payment"; // NOTE: assuming payment by default here, can be changed based on transaction.mode

  const modeRemap = {
    delegate: "stake",
    undelegate: "unstake",
  };
  const mode = modeRemap[transaction.mode] ?? transaction.mode;

  if (
    [
      "changeTrust",
      "send",
      "send-legacy",
      "send-eip1559",
      "stake",
      "unstake",
      "finalize_unstake",
    ].includes(mode)
  )
    return mode;

  throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
}

/**
 * Converts a transaction object into a `TransactionIntent` object, which is used to represent
 * the intent of a transaction in a standardized format.
 *
 * @template MemoType - The type of memo supported by the transaction, defaults to `MemoNotSupported`.
 *
 * @param account - The account initiating the transaction. Contains details such as the sender's address.
 * @param transaction - The transaction object containing details about the operation to be performed.
 *   - `assetOwner` (optional): The issuer of the asset, if applicable.
 *   - `assetReference` (optional): The code of the asset, if applicable.
 *   - `mode` (optional): The mode of the transaction, e.g., "changetrust" or "send".
 *   - `fees` (optional): The fees associated with the transaction.
 *   - `memoType` (optional): The type of memo to attach to the transaction.
 *   - `memoValue` (optional): The value of the memo to attach to the transaction.
 * @param computeIntentType - An optional function to compute the intent type that supersedes the default implementation if present
 *
 * @returns A `TransactionIntent` object containing the standardized representation of the transaction.
 *   - Includes details such as type, sender, recipient, amount, fees, asset, and an optional memo.
 *   - If `assetReference` and `assetOwner` are provided, the asset is represented as a token.
 *   - If `memoType` and `memoValue` are provided, a memo is included; otherwise, a default memo of type "NO_MEMO" is added.
 *
 * @throws An error if the transaction mode is unsupported.
 */
export function transactionToIntent(
  account: Account,
  transaction: GenericTransaction,
  computeIntentType?: (transaction: GenericTransaction) => string,
  craftTransactionData?: (intent: TransactionIntent) => TxData,
  buildIntentData?: BridgeApi["buildIntentData"],
): GenericCoinFrameworkTransactionIntent {
  const intentType = (computeIntentType ?? defaultComputeIntentType)(transaction);
  const isStaking = ["stake", "unstake", "finalize_unstake"].includes(intentType);
  const delegationMode = isDelegationMode(transaction.mode) ? transaction.mode : undefined;
  const isDelegation = delegationMode !== undefined;
  const amount = fromBigNumberToBigInt(transaction.amount, 0n);
  const useAllAmount = !!transaction.useAllAmount;
  const res: GenericCoinFrameworkTransactionIntent = {
    intentType: isStaking || isDelegation ? "staking" : "transaction",
    type: intentType,
    sender: account.freshAddress,
    // Needed upfront by families whose unsigned-tx builder embeds the public key (e.g. Stacks);
    // signOperation overwrites it with a freshly fetched value before actually signing.
    senderPublicKey: account.xpub,
    recipient: transaction.recipient,
    amount,
    asset: { type: "native", name: account.currency.name, unit: account.currency.units[0] },
    useAllAmount,
    sequence:
      transaction.nonce !== null && transaction.nonce !== undefined
        ? BigInt(transaction.nonce.toString())
        : undefined,
    ...getDelegationIntentFields(delegationMode, transaction),
  };
  if (transaction.assetReference && transaction.assetOwner) {
    const { subAccountId } = transaction;
    const { subAccounts } = account;

    const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;

    res.asset = {
      type: tokenAccount?.token.tokenType ?? "token",
      assetReference: transaction.assetReference,
      name: tokenAccount?.token.name ?? transaction.assetReference, // NOTE: for stellar, assetReference = tokenAccount.name, this is futureproofing
      unit: account.currency.units[0],
      assetOwner: transaction.assetOwner,
    };
  }

  if (typeof transaction.tag === "number") {
    res.memo = {
      type: "map",
      memos: new Map([["destinationTag", String(transaction.tag)]]),
    };
  } else if (transaction.memoType && transaction.memoValue) {
    res.memo = {
      type: transaction.memoType,
      value: transaction.memoValue,
    };
  } else {
    res.memo = { type: "NO_MEMO" };
  }

  res.data = resolveIntentData(transaction, res, craftTransactionData, buildIntentData);

  return res;
}

/**
 * A transaction that already carries data wins over both crafting paths, since a buffer is already
 * the crafted form. Otherwise the family's hook takes precedence over the coin module's crafting.
 */
function resolveIntentData(
  transaction: GenericTransaction,
  intent: GenericCoinFrameworkTransactionIntent,
  craftTransactionData?: (intent: TransactionIntent) => TxData,
  buildIntentData?: BridgeApi["buildIntentData"],
): GenericCoinFrameworkTxData {
  if (transaction.data && transaction.data.length > 0) {
    return { type: "buffer", value: transaction.data };
  }
  if (buildIntentData) {
    return buildIntentData(transaction);
  }
  return (craftTransactionData ?? defaultCraftTransactionData)(intent);
}

function toFeeDataRaw(data: FeeData): FeeDataRaw {
  return {
    gasPrice: data.gasPrice?.toFixed() ?? null,
    maxFeePerGas: data.maxFeePerGas?.toFixed() ?? null,
    maxPriorityFeePerGas: data.maxPriorityFeePerGas?.toFixed() ?? null,
    nextBaseFee: data.nextBaseFee?.toFixed() ?? null,
  };
}

function toGasOptionRaw(options: GasOptions): GasOptionsRaw {
  return {
    fast: toFeeDataRaw(options.fast),
    medium: toFeeDataRaw(options.medium),
    slow: toFeeDataRaw(options.slow),
  };
}

function toGenericTransactionRaw(transaction: GenericTransaction): GenericTransactionRaw {
  const raw: GenericTransactionRaw = {
    amount: transaction.amount.toString(),
    recipient: transaction.recipient,
    family: transaction.family,
  };

  const booleanFieldsToPropagate = ["useAllAmount", "sponsored"] as const;
  for (const field of booleanFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const stringFieldsToPropagate = [
    "memoType",
    "memoValue",
    "assetReference",
    "assetOwner",
  ] as const;
  for (const field of stringFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const numberFieldsToPropagate = ["tag", "type", "chainId"] as const;
  for (const field of numberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const bigNumberFieldsToPropagate = [
    "fees",
    "storageLimit",
    "nonce",
    "gasLimit",
    "gasPrice",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
    "additionalFees",
  ] as const;
  for (const field of bigNumberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field]?.toFixed();
    }
  }

  if ("customFees" in transaction) {
    raw.customFees =
      transaction.customFees && "fees" in transaction.customFees.parameters
        ? {
            parameters: { fees: transaction.customFees.parameters.fees?.toFixed() },
          }
        : { parameters: {} };
  }

  if ("feesStrategy" in transaction) {
    raw.feesStrategy = transaction.feesStrategy;
  }

  if ("mode" in transaction) {
    raw.mode = transaction.mode;
  }

  if ("data" in transaction) {
    raw.data = transaction.data?.toString("hex");
  }

  if ("networkInfo" in transaction) {
    raw.networkInfo = transaction.networkInfo && {
      fees: transaction.networkInfo.fees.toFixed(),
    };
  }

  if ("gasOptions" in transaction) {
    raw.gasOptions = transaction.gasOptions && toGasOptionRaw(transaction.gasOptions);
  }

  if ("recipientDomain" in transaction) {
    raw.recipientDomain = transaction.recipientDomain;
  }

  if (transaction.valAddress) {
    raw.valAddress = transaction.valAddress;
  }
  if (transaction.valId) {
    raw.valId = transaction.valId;
  }
  if (transaction.withdrawId) {
    raw.withdrawId = transaction.withdrawId;
  }
  if (transaction.dstValAddress) {
    raw.dstValAddress = transaction.dstValAddress;
  }

  if ("familySpecificData" in transaction) {
    raw.familySpecificData = transaction.familySpecificData;
  }

  return raw;
}

function defaultOperationType(mode: GenericTransaction["mode"]): OperationType {
  switch (mode) {
    case "changeTrust":
      return "OPT_IN";
    case "delegate":
      return "DELEGATE";
    case "redelegate":
      return "REDELEGATE";
    case "undelegate":
      return "UNDELEGATE";
    case "withdraw":
      return "WITHDRAW_UNBONDED";
    case "stake":
      return "STAKE";
    case "unstake":
      return "UNSTAKE";
    case "finalize_unstake":
      return "FINALIZE_UNSTAKE";
    case "claimReward":
    case "compoundReward":
      return "REWARD";
    default:
      return "OUT";
  }
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: GenericTransaction,
  sequenceNumber?: bigint,
  describeOptimisticOperation?: BridgeApi["describeOptimisticOperation"],
): Operation => {
  const { mode } = transaction;
  const described = mode !== undefined ? describeOptimisticOperation?.(mode, account) : undefined;
  const type: OperationType = described?.type ?? defaultOperationType(mode);
  // toFixed, not toString: BigNumber goes exponential above 1e21, which BigInt can't parse.
  const fees = transaction.fees ? BigInt(transaction.fees.toFixed()) : 0n;
  const { subAccountId } = transaction;
  const { subAccounts } = account;
  const parentType = subAccountId ? "FEES" : type;
  const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;
  const transactionSequenceNumber = new BigNumber(
    sequenceNumber === undefined ? "0" : sequenceNumber.toString(),
  );
  const nonce = sequenceNumber === undefined ? undefined : transactionSequenceNumber;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", parentType),
    hash: "",
    type: parentType,
    value: subAccountId
      ? new BigNumber(fees.toString()) // match old behavior
      : (described?.value ?? transaction.amount),
    fee: new BigNumber(fees.toString()),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber,
    accountId: account.id,
    date: new Date(),
    transactionRaw: toGenericTransactionRaw({
      ...transaction,
      nonce,
      ...(tokenAccount
        ? { recipient: tokenAccount.token.contractAddress, amount: new BigNumber(0) }
        : {}),
    }),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--${type}`,
        hash: "",
        type,
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(fees.toString()),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        transactionSequenceNumber,
        accountId: subAccountId,
        date: new Date(),
        transactionRaw: toGenericTransactionRaw({
          ...transaction,
          nonce,
        }),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
