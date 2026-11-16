import { zcashDefaults } from "@ledgerhq/coin-zcash/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const zcashConfig = currencyDefaultsToLiveConfig(zcashDefaults);
