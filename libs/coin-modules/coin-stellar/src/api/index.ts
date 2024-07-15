import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type StellarConfig } from "../config";
import {
  // broadcast,
  // combine,
  // craftTransaction,
  // estimateFees,
  getBalance,
  listOperations,
  // rawEncode,
} from "../logic";

export function createApi(config: StellarConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: () => Promise.reject(new Error("Method not supported")),
    combine: () => {
      throw new Error("Method not supported");
    },
    craftTransaction: () => Promise.reject(new Error("Method not supported")),
    estimateFees: () => Promise.reject(new Error("Method not supported")),
    getBalance,
    listOperations,
  };
}
