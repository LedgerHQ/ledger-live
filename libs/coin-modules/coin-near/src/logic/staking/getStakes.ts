import type { Cursor, Page, Stake, StakeAction } from "@ledgerhq/coin-module-framework/api/index";
import { getStakingPositions } from "../../network";
import type { NearStakingPosition } from "../../network/sdk.types";
import { canUnstake, canWithdraw } from "../../logic";

/**
 * A NEAR delegation splits into up to three framework stakes per staking pool: the staked
 * principal, the unstaked amount still inside the unbonding window, and the unstaked amount that
 * has become withdrawable.
 *
 * Rewards are not a separate position: a staking pool compounds them into the staked balance, so
 * `amount` already includes them and there is no `amountRewarded` to report.
 *
 * Amounts below the staking threshold are dropped. The node reports a staked balance one
 * yoctoNEAR below what was staked, so a position can otherwise linger as unactionable dust.
 */
export function toStakes(address: string, positions: NearStakingPosition[]): Stake[] {
  const items: Stake[] = [];

  for (const position of positions) {
    const { validatorId, staked, available, pending } = position;

    if (canUnstake(position)) {
      const actions: StakeAction[] = ["undelegate"];
      items.push({
        uid: `${address}:${validatorId}:staked`,
        address,
        delegate: validatorId,
        state: "active",
        actions,
        asset: { type: "native" },
        amount: BigInt(staked.toFixed(0)),
        amountDeposited: BigInt(staked.toFixed(0)),
      });
    }

    if (pending.gt(0)) {
      items.push({
        uid: `${address}:${validatorId}:pending`,
        address,
        delegate: validatorId,
        state: "deactivating",
        actions: [],
        asset: { type: "native" },
        amount: BigInt(pending.toFixed(0)),
        amountDeposited: BigInt(pending.toFixed(0)),
      });
    }

    if (canWithdraw(position)) {
      items.push({
        uid: `${address}:${validatorId}:available`,
        address,
        delegate: validatorId,
        state: "withdrawable",
        actions: ["withdraw"],
        asset: { type: "native" },
        amount: BigInt(available.toFixed(0)),
        amountDeposited: BigInt(available.toFixed(0)),
      });
    }
  }

  return items;
}

/** Staking positions across every pool the account has delegated to. Single page. */
export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const { stakingPositions } = await getStakingPositions(address);

  return { items: toStakes(address, stakingPositions), next: undefined };
}
