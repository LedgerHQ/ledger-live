import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

/** A pending unfreeze carries its expiry in `details.availableAt`, where the generic mapper reads `stateUpdatedAt`. */
const unlockDate = ({ state, stateUpdatedAt, details }: Stake): Date | undefined => {
  if (state !== "deactivating" || stateUpdatedAt) return stateUpdatedAt;
  const availableAt = details?.availableAt;
  return typeof availableAt === "string" ? new Date(availableAt) : undefined;
};

/** `getStakes` adds each vote's share of the reward to its `amount`: the position keeps its principal, the reward is claimed account-wide. */
const normalizeStake = (stake: Stake): Stake => {
  const stateUpdatedAt = unlockDate(stake);
  return {
    ...stake,
    ...(stake.amountDeposited === undefined ? {} : { amount: stake.amountDeposited }),
    ...(stateUpdatedAt ? { stateUpdatedAt } : {}),
  };
};

const tronCoinModuleStakes: CoinModuleStakesNormalization = {
  normalizeStake,
  rewardsAccountWide: true,
};

export default tronCoinModuleStakes;
