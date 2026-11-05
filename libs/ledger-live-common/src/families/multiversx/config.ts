import { multiversxDefaults } from "@ledgerhq/coin-multiversx/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const multiversxConfig = currencyDefaultsToLiveConfig(multiversxDefaults);
