import BigNumber from "bignumber.js";
import type {
  AccountLike,
  StakingDelegation,
  StakingResources,
  StakingUnbonding,
} from "@ledgerhq/types-live";

function getAccountMagnitude(account: AccountLike): number {
  const currency = account.type === "Account" ? account.currency : account.token;
  return currency.units[0]?.magnitude ?? 0;
}

function getStakingResources(account: AccountLike): StakingResources | undefined {
  if (account.type !== "Account" || !("stakingResources" in account)) return undefined;
  const { stakingResources } = account as { stakingResources?: StakingResources };
  return stakingResources;
}

function heldNativeAmount(position: StakingDelegation | StakingUnbonding): BigNumber {
  const { activeAmount, inactiveAmount, lockedReserve } = position;
  const staked =
    activeAmount && inactiveAmount ? activeAmount.plus(inactiveAmount) : position.amount;
  return staked.plus(lockedReserve ?? 0);
}

function stakedAmount(resources: StakingResources): BigNumber {
  return [...resources.delegations, ...resources.unbondings].reduce(
    (sum, position) => sum.plus(heldNativeAmount(position)),
    new BigNumber(0),
  );
}

/**
 * The non-spendable part of the balance also holds chain reserves that are not staked
 * (e.g. Solana's rent-exempt minimum), so it is capped by the staked positions when known.
 */
function computeAccountEarnDeposit(account: AccountLike): BigNumber {
  const locked = BigNumber.max(account.balance.minus(account.spendableBalance), 0);
  const stakingResources = getStakingResources(account);
  if (!stakingResources) return locked;
  return BigNumber.min(locked, stakedAmount(stakingResources));
}

export function computeAvailableAndEarnDeposit(
  accounts: AccountLike[],
  referenceMagnitude: number,
) {
  let available = new BigNumber(0);
  let deposit = new BigNumber(0);
  for (const account of accounts) {
    const shift = referenceMagnitude - getAccountMagnitude(account);
    const accountDeposit = computeAccountEarnDeposit(account);
    deposit = deposit.plus(accountDeposit.shiftedBy(shift));
    available = available.plus(account.balance.minus(accountDeposit).shiftedBy(shift));
  }
  return {
    availableBalance: available,
    earnDeposit: deposit,
  };
}
