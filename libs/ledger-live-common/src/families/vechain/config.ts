import { vechainDefaults } from "@ledgerhq/coin-vechain/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const vechainConfig = currencyDefaultsToLiveConfig(vechainDefaults);
