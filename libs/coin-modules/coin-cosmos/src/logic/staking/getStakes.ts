import { Cursor, Page, Stake, StakeAction } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";

/**
 * Current staking positions as framework `Stake`s: each delegation maps to `active`
 * (bonded validator) or `inactive` (otherwise); unbondings → `deactivating`/
 * `withdrawable`; `amount` is principal + rewards. Babylon pending-epoch delegations
 * aren't in the node's delegation set until the epoch applies, so they appear only once bonded.
 */
export async function getStakes(
  api: CosmosAPI,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> {
  const currency = api.getCurrency();
  const [delegations, unbondings] = await Promise.all([
    api.getDelegations(address, currency),
    api.getUnbondings(address),
  ]);

  const items: Stake[] = [];

  for (const d of delegations) {
    const deposited = BigInt(d.amount.integerValue().toFixed());
    const rewarded = BigInt(d.pendingRewards.integerValue().toFixed());
    const actions: StakeAction[] = ["undelegate", "redelegate"];
    if (rewarded > 0n) {
      actions.push("claim_reward");
    }
    items.push({
      uid: `${address}:${d.validatorAddress}`,
      address,
      delegate: d.validatorAddress,
      state: d.status === "bonded" ? "active" : "inactive",
      actions,
      asset: { type: "native" },
      amount: deposited + rewarded,
      amountDeposited: deposited,
      amountRewarded: rewarded,
    });
  }

  for (const u of unbondings) {
    const amount = BigInt(u.amount.integerValue().toFixed());
    const completed = u.completionDate.getTime() <= Date.now();
    items.push({
      uid: `${address}:${u.validatorAddress}:unbonding:${u.completionDate.getTime()}`,
      address,
      delegate: u.validatorAddress,
      state: completed ? "withdrawable" : "deactivating",
      actions: [],
      asset: { type: "native" },
      amount,
      amountDeposited: amount,
      amountRewarded: 0n,
    });
  }

  return { items };
}
