import type { AssetInfo, Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { AccountOperation, JsonObject, JsonValue } from "./types";

/**
 * JSON forms of the values a module persists in its state, or a client in its stores: amounts as
 * decimal strings, dates as ISO strings.
 */

/** Structurally portfolio-module-framework's `OperationView`. */
export type JsonOperation = {
  id: string;
  hash: string;
  type: string;
  value: string;
  fee: string;
  asset: AssetInfo;
  senders: string[];
  recipients: string[];
  feesPayer?: string;
  memo?: JsonValue;
  block: { height: number; hash: string; time: string } | null;
  date: string;
  failed: boolean;
  optimistic?: boolean;
  details?: JsonObject;
};

export function toJsonOperation(op: AccountOperation): JsonOperation {
  return {
    id: op.id,
    hash: op.hash,
    type: op.type,
    value: op.value.toString(),
    fee: op.fee.toString(),
    asset: op.asset,
    senders: op.senders,
    recipients: op.recipients,
    ...(op.feesPayer === undefined ? {} : { feesPayer: op.feesPayer }),
    ...(op.memo === undefined ? {} : { memo: toJsonSafe(op.memo) }),
    block: op.block ? { ...op.block, time: op.block.time.toISOString() } : null,
    date: op.date.toISOString(),
    failed: op.failed,
    ...(op.optimistic ? { optimistic: true } : {}),
    ...(op.details ? { details: toJsonSafe(op.details) as JsonObject } : {}),
  };
}

export function fromJsonOperation(op: JsonOperation): AccountOperation {
  return {
    id: op.id,
    hash: op.hash,
    type: op.type,
    value: BigInt(op.value),
    fee: BigInt(op.fee),
    asset: op.asset,
    senders: op.senders,
    recipients: op.recipients,
    ...(op.feesPayer === undefined ? {} : { feesPayer: op.feesPayer }),
    ...(op.memo === undefined ? {} : { memo: op.memo }),
    block: op.block ? { ...op.block, time: new Date(op.block.time) } : null,
    date: new Date(op.date),
    failed: op.failed,
    ...(op.optimistic ? { optimistic: true } : {}),
    ...(op.details ? { details: op.details } : {}),
  };
}

export type JsonStake = Omit<
  Stake,
  "amount" | "amountDeposited" | "amountRewarded" | "stateUpdatedAt" | "createdAt" | "details"
> & {
  details?: JsonObject;
  amount: string;
  amountDeposited?: string;
  amountRewarded?: string;
  stateUpdatedAt?: string;
  createdAt?: string;
};

export function toJsonStake(stake: Stake): JsonStake {
  const { amount, amountDeposited, amountRewarded, stateUpdatedAt, createdAt, details, ...rest } =
    stake;
  return {
    ...rest,
    ...(details ? { details: toJsonSafe(details) as JsonObject } : {}),
    amount: amount.toString(),
    ...(amountDeposited === undefined ? {} : { amountDeposited: amountDeposited.toString() }),
    ...(amountRewarded === undefined ? {} : { amountRewarded: amountRewarded.toString() }),
    ...(stateUpdatedAt === undefined ? {} : { stateUpdatedAt: stateUpdatedAt.toISOString() }),
    ...(createdAt === undefined ? {} : { createdAt: createdAt.toISOString() }),
  };
}

export function fromJsonStake(stake: JsonStake): Stake {
  const { amount, amountDeposited, amountRewarded, stateUpdatedAt, createdAt, ...rest } = stake;
  return {
    ...rest,
    amount: BigInt(amount),
    ...(amountDeposited === undefined ? {} : { amountDeposited: BigInt(amountDeposited) }),
    ...(amountRewarded === undefined ? {} : { amountRewarded: BigInt(amountRewarded) }),
    ...(stateUpdatedAt === undefined ? {} : { stateUpdatedAt: new Date(stateUpdatedAt) }),
    ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
  };
}

export type JsonBalance = {
  value: string;
  asset: AssetInfo;
  locked?: string;
  stake?: JsonStake;
};

export function toJsonBalance(balance: Balance): JsonBalance {
  return {
    value: balance.value.toString(),
    asset: balance.asset,
    ...(balance.locked === undefined ? {} : { locked: balance.locked.toString() }),
    ...(balance.stake ? { stake: toJsonStake(balance.stake) } : {}),
  };
}

export function fromJsonBalance(balance: JsonBalance): Balance {
  return {
    value: BigInt(balance.value),
    asset: balance.asset,
    ...(balance.locked === undefined ? {} : { locked: BigInt(balance.locked) }),
    ...(balance.stake ? { stake: fromJsonStake(balance.stake) } : {}),
  };
}

/** A `bignumber.js` value, of any copy of the library (its own `isBigNumber` test). */
const isBigNumberLike = (value: unknown): value is { toFixed: () => string } =>
  (value as { _isBigNumber?: unknown } | null | undefined)?._isBigNumber === true;

/**
 * The JSON form of `value`, for module data whose shape the caller does not know: what
 * `JSON.parse(JSON.stringify(value))` gives, except that bigints become decimal strings and
 * BigNumbers decimal strings without exponent (`toFixed`). So dates become ISO strings, Buffers
 * `{ type, data }`, Maps and Sets `{}`; `undefined` fields and functions are dropped; `undefined`
 * at the top level becomes `null`. A circular value throws.
 */
export function toJsonSafe(value: unknown): JsonValue {
  const json = JSON.stringify(
    value,
    function (this: Record<string, unknown>, key: string, replaced: unknown) {
      // The value before its own toJSON ran: a BigNumber's may use exponent notation.
      const raw = this[key];
      if (typeof raw === "bigint") return raw.toString();
      if (isBigNumberLike(raw)) return raw.toFixed();
      if (typeof replaced === "bigint") return replaced.toString();
      return replaced;
    },
  );
  return json === undefined ? null : (JSON.parse(json) as JsonValue);
}
