import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  StakingPosition,
  StakingPositionRaw,
  TezosAccount,
  TezosAccountRaw,
} from "./types/bridge";

function toStakingPositionRaw(p: StakingPosition): StakingPositionRaw {
  return {
    uid: p.uid,
    address: p.address,
    ...(p.delegate && { delegate: p.delegate }),
    state: p.state,
    amount: p.amount.toString(),
  };
}

function fromStakingPositionRaw(r: StakingPositionRaw): StakingPosition {
  return {
    uid: r.uid,
    address: r.address,
    ...(r.delegate && { delegate: r.delegate }),
    state: r.state,
    asset: { type: "native" },
    amount: new BigNumber(r.amount),
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
