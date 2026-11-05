import { tronDefaults } from "@ledgerhq/coin-tron/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const tronConfig = currencyDefaultsToLiveConfig(tronDefaults);
