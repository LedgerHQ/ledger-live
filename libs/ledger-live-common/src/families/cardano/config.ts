import { cardanoDefaults } from "@ledgerhq/coin-cardano/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const cardanoConfig = currencyDefaultsToLiveConfig(cardanoDefaults);
