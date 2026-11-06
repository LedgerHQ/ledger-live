import { concordiumDefaults } from "@ledgerhq/coin-concordium/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const concordiumConfig = currencyDefaultsToLiveConfig(concordiumDefaults);
