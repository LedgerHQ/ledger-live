import type { Api } from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
import coinConfig from "../config";
import type { AptosAsset, AptosExtra, AptosSender } from "../types/assets";
import {
  broadcast as broadcastWrapper,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { AptosAPI } from "../network";

export function createApi(config: AptosConfigApi): Api<AptosAsset, AptosExtra, AptosSender> {
  const client: AptosAPI = new AptosAPI(config.aptosSettings);

  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: tx => broadcastWrapper(config.aptosSettings, tx),
    combine,
    craftTransaction: (txIntent, customFees) => craftTransaction(client, txIntent, customFees),
    estimateFees,
    getBalance,
    lastBlock,
    listOperations,
  };
}
