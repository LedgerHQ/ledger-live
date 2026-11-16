import { commissionAsFraction } from "../../coin-modules/commissionAsFraction";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

/** A pool's `margin` is a percentage. */
const cardanoCoinModuleStakes: CoinModuleStakesNormalization = {
  normalizeValidator: commissionAsFraction(100),
};

export default cardanoCoinModuleStakes;
