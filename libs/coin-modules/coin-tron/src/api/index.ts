import {
  // IncorrectTypeError,
  // Pagination,
  type Api,
  // type Transaction as ApiTransaction,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
} from "../logic";

export function createApi(config: TronConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

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
