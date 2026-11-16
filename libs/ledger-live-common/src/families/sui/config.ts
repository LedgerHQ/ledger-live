import { suiDefaults } from "@ledgerhq/coin-sui/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const suiConfig = currencyDefaultsToLiveConfig(suiDefaults);
