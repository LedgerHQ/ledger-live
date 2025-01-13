import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { AptosCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";

export function createApi(config: CoinConfig<AptosCoinConfig>): Api {
  coinConfig.setCoinConfig(config);

  return {
    broadcast,
    combine,
    craftTransaction,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations,
  };
}
