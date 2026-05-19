import BigNumber from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";

export type BNLike = BigNumber | number | string;

function toBN(v: BNLike): BigNumber {
  return BigNumber.isBigNumber(v) ? v : new BigNumber(v);
}

export type OpOverrides = {
  id?: string;
  hash?: string;
  /**
   * Accepts any string, not just `OperationType`. This mirrors the open-set
   * design of `classifyOperation` (INFLOWS / OUTFLOWS hold strings beyond the
   * canonical union, e.g. "SUPPLY" / "REDEEM" / "SELL"). The single boundary
   * cast lives in `makeOp` below.
   */
  type?: OperationType | string;
  value?: number | BigNumber;
  fee?: number | BigNumber;
  date?: Date | string;
  hasFailed?: boolean;
  senders?: string[];
  recipients?: string[];
  accountId?: string;
};

let _counter = 0;
function nextId(): string {
  _counter += 1;
  return `op-${String(_counter).padStart(6, "0")}`;
}

export function resetOperationIdCounter(): void {
  _counter = 0;
}

function toDate(d: Date | string | undefined): Date {
  if (d === undefined) return new Date(0);
  return d instanceof Date ? d : new Date(d);
}

export function makeOp(overrides: OpOverrides = {}): Operation {
  const id = overrides.id ?? nextId();
  return {
    id,
    hash: overrides.hash ?? id,
    // Cast at the scenario boundary: the `Operation.type` field is the
    // canonical `OperationType` union, but the classifier treats it as an
    // open string set. Scenarios need to pass strings outside the union.
    type: (overrides.type ?? "IN") as OperationType,
    value: toBN(overrides.value ?? 0),
    fee: toBN(overrides.fee ?? 0),
    senders: overrides.senders ?? [],
    recipients: overrides.recipients ?? [],
    blockHeight: 1,
    blockHash: "0xblock",
    accountId: overrides.accountId ?? "acc",
    date: toDate(overrides.date),
    hasFailed: overrides.hasFailed ?? false,
    extra: {},
  };
}

// `value` in sugar helpers is in the asset's atomic unit (sat for BTC, wei for ETH).

const defineOp =
  (type: OperationType) =>
  (value: number | BigNumber, date: Date | string, extra: OpOverrides = {}): Operation =>
    makeOp({ type, value, date, ...extra });

export const buy = defineOp("IN");
export const sell = defineOp("OUT");
export const reward = defineOp("REWARD");

export const fail = (
  type: OperationType,
  value: number | BigNumber,
  date: Date | string,
  extra: OpOverrides = {},
): Operation => makeOp({ type, value, date, hasFailed: true, ...extra });
