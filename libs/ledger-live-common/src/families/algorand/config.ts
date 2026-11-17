import { algorandDefaults } from "@ledgerhq/coin-algorand/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const algorandConfig = currencyDefaultsToLiveConfig(algorandDefaults);
