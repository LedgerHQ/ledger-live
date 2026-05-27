import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import type {
  StakingPosition,
  StakingPositionRaw,
  TezosAccount,
  TezosAccountRaw,
} from "./types/bridge";

function safeISOString(d: Date, uid: string): string | undefined {
  if (Number.isFinite(d.getTime())) return d.toISOString();
  log("coin:tezos", "serialization: dropping invalid createdAt on serialize", { uid });
  return undefined;
}

function safeDate(s: string, uid: string): Date | undefined {
  const d = new Date(s);
  if (Number.isFinite(d.getTime())) return d;
  log("coin:tezos", "serialization: dropping invalid createdAt on restore", { uid, raw: s });
  return undefined;
}

function toStakingPositionRaw(p: StakingPosition): StakingPositionRaw {
  const createdAt = p.createdAt && safeISOString(p.createdAt, p.uid);
  return {
    uid: p.uid,
    address: p.address,
    ...(p.delegate && { delegate: p.delegate }),
    state: p.state,
    amount: p.amount.toString(),
    ...(createdAt && { createdAt }),
  };
}

function fromStakingPositionRaw(r: StakingPositionRaw): StakingPosition {
  const createdAt = r.createdAt && safeDate(r.createdAt, r.uid);
  return {
    uid: r.uid,
    address: r.address,
    ...(r.delegate && { delegate: r.delegate }),
    state: r.state,
    asset: { type: "native" },
    amount: new BigNumber(r.amount),
    actions: [],
    ...(createdAt && { createdAt }),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const positions = (account as TezosAccount).stakingPositions;
  if (positions?.length) {
    (accountRaw as TezosAccountRaw).stakingPositions = positions.map(toStakingPositionRaw);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const raw = (accountRaw as TezosAccountRaw).stakingPositions;
  (account as TezosAccount).stakingPositions = raw ? raw.map(fromStakingPositionRaw) : [];
}
