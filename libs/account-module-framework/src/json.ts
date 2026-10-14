import type { AssetInfo, Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { AccountOperation, JsonObject, JsonValue } from "./types";

/**
 * JSON forms of the values a module persists in its state, or a client in its stores: amounts as
 * decimal strings, dates as ISO strings.
 */

export type JsonOperation = {
  id: string;
  hash: string;
  type: string;
  value: string;
  fee: string;
  asset: AssetInfo;
  senders: string[];
  recipients: string[];
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

/**
 * A copy of `value` that JSON keeps as is: bigints become decimal strings, dates ISO strings,
 * `undefined` fields are dropped. For module data whose shape the caller does not know.
 */
export function toJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) out[key] = toJsonSafe(item);
    }
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  throw new Error(`Not JSON safe: ${typeof value}`);
}
