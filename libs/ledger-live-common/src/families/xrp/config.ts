import { xrpDefaults } from "@ledgerhq/coin-xrp/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const xrpConfig = currencyDefaultsToLiveConfig(xrpDefaults);
