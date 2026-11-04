import { aptosDefaults } from "@ledgerhq/coin-aptos/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const aptosConfig = currencyDefaultsToLiveConfig(aptosDefaults);
