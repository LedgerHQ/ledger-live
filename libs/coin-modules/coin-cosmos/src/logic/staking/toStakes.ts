import { Stake, StakeAction } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosDelegation, CosmosUnbonding } from "../../types";

export function buildStakes(
  address: string,
  positions: { delegations: CosmosDelegation[]; unbondings: CosmosUnbonding[] },
): Stake[] {
  const items: Stake[] = [];

  for (const d of positions.delegations) {
    const deposited = BigInt(d.amount.integerValue().toFixed());
    const rewarded = BigInt(d.pendingRewards.integerValue().toFixed());
    const actions: StakeAction[] = ["undelegate", "redelegate"];
    if (rewarded > 0n) actions.push("claim_reward");
    items.push({
      uid: `${address}:${d.validatorAddress}`,
      address,
      delegate: d.validatorAddress,
      // A delegation is an active position — don't gate on d.status (the validator's bond-status,
      // which the framework's state-derived status can't express anyway).
      state: "active",
      actions,
      asset: { type: "native" },
      amount: deposited, // principal only — framework sums this into delegatedBalance
      amountDeposited: deposited,
      amountRewarded: rewarded,
    });
  }

  for (const u of positions.unbondings) {
    const amount = BigInt(u.amount.integerValue().toFixed());
    const completed = u.completionDate.getTime() <= Date.now();
    items.push({
      uid: `${address}:${u.validatorAddress}:unbonding:${u.completionDate.getTime()}`,
      address,
      delegate: u.validatorAddress,
      state: completed ? "withdrawable" : "deactivating",
      // framework reads stateUpdatedAt as the unbonding's completionDate (getAccountShape)
      stateUpdatedAt: u.completionDate,
      actions: [],
      asset: { type: "native" },
      amount,
      amountDeposited: amount,
      amountRewarded: 0n,
    });
  }

  return items;
}
