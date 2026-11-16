import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { commissionAsFraction } from "../../coin-modules/commissionAsFraction";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

const toLamports = (value: unknown): bigint | undefined => {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  return undefined;
};

/** An undelegated stake account reports no delegation (`amount: 0n`): it holds what it can withdraw, as FullSync tells. */
function normalizeStake(stake: Stake): Stake {
  const withdrawable = toLamports(stake.details?.withdrawableAmount);
  if (stake.state !== "inactive" || withdrawable === undefined || withdrawable <= stake.amount) {
    return stake;
  }
  const { amountDeposited: _deposited, amountRewarded: _rewarded, ...rest } = stake;
  return { ...rest, state: "withdrawable", amount: withdrawable };
}

const solanaCoinModuleStakes: CoinModuleStakesNormalization = {
  normalizeStake,
  // The validators app counts the commission in percent.
  normalizeValidator: commissionAsFraction(100),
};

export default solanaCoinModuleStakes;
