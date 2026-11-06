import { celoDefaults } from "@ledgerhq/coin-celo/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const celoConfig = currencyDefaultsToLiveConfig(celoDefaults);
