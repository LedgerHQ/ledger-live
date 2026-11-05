import { hederaDefaults } from "@ledgerhq/coin-hedera/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const hederaConfig = currencyDefaultsToLiveConfig(hederaDefaults);
