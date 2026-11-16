import { internet_computerDefaults } from "@ledgerhq/coin-internet_computer/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const internetComputerConfig = currencyDefaultsToLiveConfig(internet_computerDefaults);
