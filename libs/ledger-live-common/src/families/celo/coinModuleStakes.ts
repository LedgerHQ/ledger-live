import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

/** A pending withdrawal carries its expiry in `details.availableAt` (Unix seconds), where the generic mapper reads `stateUpdatedAt`. */
function normalizeStake(stake: Stake): Stake {
  const availableAt = stake.details?.availableAt;
  if (stake.state !== "deactivating" || stake.stateUpdatedAt || typeof availableAt !== "number") {
    return stake;
  }
  return { ...stake, stateUpdatedAt: new Date(availableAt * 1000) };
}

const celoCoinModuleStakes: CoinModuleStakesNormalization = { normalizeStake };

export default celoCoinModuleStakes;
