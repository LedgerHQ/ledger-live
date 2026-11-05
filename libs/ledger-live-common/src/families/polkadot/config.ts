import { polkadotDefaults } from "@ledgerhq/coin-polkadot/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const polkadotConfig = currencyDefaultsToLiveConfig(polkadotDefaults);
