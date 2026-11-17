import { cantonDefaults } from "@ledgerhq/coin-canton/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const cantonConfig = currencyDefaultsToLiveConfig(cantonDefaults);
