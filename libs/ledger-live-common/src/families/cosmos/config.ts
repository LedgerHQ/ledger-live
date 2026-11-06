// Encapsulate for LLD & LLM
import { cosmosDefaults } from "@ledgerhq/coin-cosmos/config";
import { currencyDefaultsToLiveConfig } from "../../config";

export const cosmosConfig = currencyDefaultsToLiveConfig(cosmosDefaults);
