import { minaDefaults } from "@ledgerhq/coin-mina/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const minaConfig = currencyDefaultsToLiveConfig(minaDefaults);
