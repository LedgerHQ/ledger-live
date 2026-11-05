import { filecoinDefaults } from "@ledgerhq/coin-filecoin/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const fileCoinConfig = currencyDefaultsToLiveConfig(filecoinDefaults);
