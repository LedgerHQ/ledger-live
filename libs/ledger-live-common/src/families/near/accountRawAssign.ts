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
  // Absent stays absent, `[]` stays `[]`. The UI reads an empty array as "nothing staked" and an
  // absent field as "fall back to the legacy nearResources blob", so both have to survive the
  // cycle verbatim. Defaulting an absent field to `[]` would hide the staking data of every
  // account persisted before the migration until its first successful generic sync.
  if (raw === undefined) return;
  (account as AccountWithStakingPositions).stakingPositions = raw.map(fromStakingPositionRaw);
}

export default {
  assignToAccountRaw,
  assignFromAccountRaw,
};
