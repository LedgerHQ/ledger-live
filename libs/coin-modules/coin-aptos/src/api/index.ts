import type { Api } from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
import type { Balance, Operation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { AptosAsset, AptosExtra, AptosFeeParameters, AptosSender } from "../types/assets";
import { AptosAPI } from "../network";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";

export function createApi(
  config: AptosConfigApi,
): Api<AptosAsset, AptosExtra, AptosSender, AptosFeeParameters> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  const client = new AptosAPI(config.aptosSettings);

  return {
    broadcast: (tx: string) => client.broadcast(tx),
    combine: (tx, signature, pubkey): string => combine(tx, signature, pubkey),
    craftTransaction: (transactionIntent, _customFees): Promise<string> =>
      craftTransaction(client, transactionIntent),
    estimateFees: (transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>) =>
      client.estimateFees(transactionIntent),
    getBalance: (_address): Promise<Balance<AptosAsset>[]> => {
      throw new Error("Not Implemented");
    },
    lastBlock: () => client.getLastBlock(),
    listOperations: (_address, _pagination): Promise<[Operation<AptosAsset>[], string]> => {
      throw new Error("Not Implemented");
    },
  };
}
