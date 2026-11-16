import { solanaDefaults } from "@ledgerhq/coin-solana/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const solanaConfig = currencyDefaultsToLiveConfig(solanaDefaults);
