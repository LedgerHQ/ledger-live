import { tonDefaults } from "@ledgerhq/coin-ton/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const tonConfig = currencyDefaultsToLiveConfig(tonDefaults);
