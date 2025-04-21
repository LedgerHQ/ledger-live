import type { Api } from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
import coinConfig from "../config";
import type { AptosAsset } from "../types/assets";
import {
  broadcast as broadcastWrapper,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";

export function createApi(config: AptosConfigApi): Api<AptosAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: tx => broadcastWrapper(config.aptosSettings, tx),
    combine,
    craftTransaction,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations,
  };
}
