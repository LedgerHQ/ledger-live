import type { Api } from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
<<<<<<< HEAD
import type { Balance, Operation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { AptosAsset, AptosExtra, AptosFeeParameters, AptosSender } from "../types/assets";
import { AptosAPI } from "../network";

export function createApi(
  config: AptosConfigApi,
): Api<AptosAsset, AptosExtra, AptosSender, AptosFeeParameters> {
=======
import type { Balance, FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { AptosAsset } from "../types/assets";
import { AptosAPI } from "../network";

export function createApi(config: AptosConfigApi): Api<AptosAsset> {
>>>>>>> develop
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  const client = new AptosAPI(config.aptosSettings);

  return {
    broadcast: (tx: string) => client.broadcast(tx),
    combine: (_tx, _signature, _pubkey): string => {
      throw new Error("Not Implemented");
    },
    craftTransaction: (_transactionIntent, _customFees): Promise<string> => {
      throw new Error("Not Implemented");
    },
<<<<<<< HEAD
    estimateFees: (transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>) =>
      client.estimateFees(transactionIntent),
=======
    estimateFees: (_transactionIntent): Promise<FeeEstimation<never>> => {
      throw new Error("Not Implemented");
    },
>>>>>>> develop
    getBalance: (_address): Promise<Balance<AptosAsset>[]> => {
      throw new Error("Not Implemented");
    },
    lastBlock: () => client.getLastBlock(),
    listOperations: (_address, _pagination): Promise<[Operation<AptosAsset>[], string]> => {
      throw new Error("Not Implemented");
    },
  };
}
