import { bitcoinDefaults } from "@ledgerhq/coin-bitcoin/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const bitcoinConfig = currencyDefaultsToLiveConfig(bitcoinDefaults);
