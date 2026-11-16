import { tezosDefaults } from "@ledgerhq/coin-tezos/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const tezosConfig = currencyDefaultsToLiveConfig(tezosDefaults);
