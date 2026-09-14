import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

/**
 * Persists `account.stakingPositions` across the `toAccountRaw` / `fromAccountRaw` cycle.
 *
 * The generic-coin-framework populates this field for families that opt into
 * `usesStakingPositions`, but the shared serializer only carries family-specific account
 * resources through these hooks. Without them NEAR loses every staking position on restart
 * and shows an empty staking section until the next successful sync.
 *
 * Only `amount` needs converting: NEAR's `toStakes` fills `uid`, `address`, `delegate`,
 * `state`, `actions` and `asset`, all of which are already JSON-safe. The optional
 * `amountDeposited` / `amountRewarded` are handled too so a later change to `getStakes`
 * cannot silently drop them.
 *
 * Mirrors `families/tezos/accountRawAssign.ts`.
 */

type StakingPositionOnAccount = {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
  [key: string]: unknown;
};

type StakingPositionRaw = {
  amount: string;
  amountDeposited?: string;
  amountRewarded?: string;
  [key: string]: unknown;
};

type AccountWithStakingPositions = Account & {
  stakingPositions?: StakingPositionOnAccount[];
};

type AccountRawWithStakingPositions = AccountRaw & {
  stakingPositions?: StakingPositionRaw[];
};

function toStakingPositionRaw(position: StakingPositionOnAccount): StakingPositionRaw {
  const { amount, amountDeposited, amountRewarded, ...rest } = position;
  return {
    ...rest,
    amount: amount.toFixed(),
    ...(amountDeposited !== undefined && { amountDeposited: amountDeposited.toFixed() }),
    ...(amountRewarded !== undefined && { amountRewarded: amountRewarded.toFixed() }),
  };
}

function fromStakingPositionRaw(raw: StakingPositionRaw): StakingPositionOnAccount {
  const { amount, amountDeposited, amountRewarded, ...rest } = raw;
  return {
    ...rest,
    amount: new BigNumber(amount),
    ...(amountDeposited !== undefined && { amountDeposited: new BigNumber(amountDeposited) }),
    ...(amountRewarded !== undefined && { amountRewarded: new BigNumber(amountRewarded) }),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const positions = (account as AccountWithStakingPositions).stakingPositions;
  if (positions) {
    (accountRaw as AccountRawWithStakingPositions).stakingPositions =
      positions.map(toStakingPositionRaw);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const raw = (accountRaw as AccountRawWithStakingPositions).stakingPositions;
  // Always set the field: an empty array means "nothing staked" and must stay distinguishable
  // from an absent field, which the UI treats as "fall back to the legacy nearResources blob".
  (account as AccountWithStakingPositions).stakingPositions = raw
    ? raw.map(fromStakingPositionRaw)
    : [];
}

export default {
  assignToAccountRaw,
  assignFromAccountRaw,
};
