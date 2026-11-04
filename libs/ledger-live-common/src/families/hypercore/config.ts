import { hypercoreDefaults } from "@ledgerhq/coin-hypercore/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const hypercoreConfig = currencyDefaultsToLiveConfig(hypercoreDefaults);
