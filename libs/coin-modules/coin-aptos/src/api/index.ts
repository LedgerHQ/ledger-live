import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
import type { Balance, Pagination, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { AptosAsset } from "../types/assets";
import { AptosAPI } from "../network";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { getBalances } from "../logic/getBalances";

export function createApi(config: AptosConfigApi): AlpacaApi<AptosAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  const client = new AptosAPI(config.aptosSettings);

  return {
    broadcast: (tx: string) => client.broadcast(tx),
    combine: (tx, signature, pubkey): string => combine(tx, signature, pubkey),
    craftTransaction: (transactionIntent, _customFees): Promise<string> =>
      craftTransaction(client, transactionIntent),
    estimateFees: (transactionIntent: TransactionIntent<AptosAsset>) =>
      client.estimateFees(transactionIntent),
    getBalance: (address): Promise<Balance<AptosAsset>[]> => getBalances(client, address),
    lastBlock: () => client.getLastBlock(),
    listOperations: (address: string, pagination: Pagination) =>
      client.listOperations(address, pagination),
  };
}
