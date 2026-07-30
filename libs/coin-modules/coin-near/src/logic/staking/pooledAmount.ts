import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { getStakingPositions } from "../../network";

/** Sum of the staking positions in a given state, per pool. */
function stakedAt(balances: Balance[], delegate: string, states: string[]): bigint {
  return balances
    .filter(b => b.stake !== undefined && b.stake.delegate === delegate)
    .filter(b => states.includes(b.stake!.state))
    .reduce((acc, b) => acc + b.stake!.amount, 0n);
}

/**
 * What the pool holds for the sender, in the bucket the mode moves: the delegated amount for
 * `unstake`, the released one for `withdraw`.
 *
 * Balances are the source when the caller has them and they carry staking entries. The generic
 * framework rebuilds balances from the account and drops those entries, and prices fees without any
 * balances at all, so the pool is queried directly in both cases. coin-tezos reads the chain inside
 * its own validation for the same reason.
 */
export async function pooledAmount(
  mode: string,
  sender: string,
  delegate: string,
  balances?: Balance[],
): Promise<bigint> {
  const states = mode === "unstake" ? ["active", "activating"] : ["withdrawable"];

  if (balances?.some(b => b.stake !== undefined)) {
    return stakedAt(balances, delegate, states);
  }

  const { stakingPositions } = await getStakingPositions(sender);
  const position = stakingPositions.find(p => p.validatorId === delegate);

  if (!position) {
    return 0n;
  }

  return BigInt((mode === "unstake" ? position.staked : position.available).toFixed(0));
}
