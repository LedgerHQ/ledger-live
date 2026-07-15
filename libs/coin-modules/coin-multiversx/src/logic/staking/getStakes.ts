import type { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { MultiversXNetworkApi } from "../../network/api";

/**
 * Returns staking positions for a MultiversX address.
 *
 * - Active delegation → state: "active"
 * - Unbonding amounts (userUndelegatedList) → separate Stake entries: still unbonding
 *   (seconds > 0) → state "deactivating" (no action); matured (seconds <= 0) →
 *   state "withdrawable" with action "withdraw"
 * - No delegations → empty page (not error)
 */
export async function getStakes(
  api: MultiversXNetworkApi,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> {
  // Let a delegation-API failure propagate rather than returning an empty page —
  // silently hiding staking positions is data loss (consistent with listOperations).
  const delegations = await api.getAccountDelegations(address);

  const items: Stake[] = [];

  for (const delegation of delegations) {
    const deposited = BigInt(new BigNumber(delegation.userActiveStake).toFixed(0));
    const rewarded = BigInt(new BigNumber(delegation.claimableRewards).toFixed(0));
    const amount = deposited + rewarded;

    const activeStake: Stake = {
      uid: `${address}-${delegation.contract}-active`,
      address,
      delegate: delegation.contract,
      state: "active",
      asset: { type: "native" },
      amount,
      amountDeposited: deposited,
      amountRewarded: rewarded,
      actions: ["undelegate", "claim_reward", "redelegate"],
    };
    items.push(activeStake);

    // Unbonding positions — matured (timer elapsed) funds are withdrawable, the
    // rest are still deactivating. The uid stays state-independent so a position
    // isn't seen as a new stake once it matures.
    for (let i = 0; i < delegation.userUndelegatedList.length; i++) {
      const unbonding = delegation.userUndelegatedList[i];
      const unbondingAmount = BigInt(new BigNumber(unbonding.amount).toFixed(0));
      const matured = unbonding.seconds <= 0;

      const unbondingStake: Stake = {
        uid: `${address}-${delegation.contract}-unbonding-${i}`,
        address,
        delegate: delegation.contract,
        state: matured ? "withdrawable" : "deactivating",
        asset: { type: "native" },
        amount: unbondingAmount,
        amountDeposited: unbondingAmount,
        amountRewarded: 0n,
        actions: matured ? ["withdraw"] : [],
        details: {
          unbondingSeconds: unbonding.seconds,
        },
      };
      items.push(unbondingStake);
    }
  }

  return { items };
}
