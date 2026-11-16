import { commissionAsFraction } from "../../coin-modules/commissionAsFraction";
import type { CoinModuleStakesNormalization } from "../../coin-modules/types";

/** The node's fee fraction comes rounded to a percentage. */
const nearCoinModuleStakes: CoinModuleStakesNormalization = {
  normalizeValidator: commissionAsFraction(100),
};

export default nearCoinModuleStakes;
