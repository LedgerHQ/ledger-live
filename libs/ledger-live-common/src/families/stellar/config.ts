import { stellarDefaults } from "@ledgerhq/coin-stellar/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const stellarConfig = currencyDefaultsToLiveConfig(stellarDefaults);
