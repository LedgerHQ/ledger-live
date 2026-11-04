import { kaspaDefaults } from "@ledgerhq/coin-kaspa/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const kaspaConfig = currencyDefaultsToLiveConfig(kaspaDefaults);
