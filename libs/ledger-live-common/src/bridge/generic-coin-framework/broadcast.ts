import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { GenericTransaction } from "./types";

export const genericBroadcast: (
  network: string,
  kind: string,
) => AccountBridge<GenericTransaction>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation }, account, broadcastConfig }) => {
    const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
    const bridgeApi = await getBridgeApi(account.currency, network);
    if (bridgeApi.validateTransaction) {
      const validation = await bridgeApi.validateTransaction(signature);
      if (validation.error !== undefined) {
        throw validation.error;
      }
    }
    const hash = await coinModuleApi.broadcast(signature, broadcastConfig);

    return patchOperationWithHash(operation, hash);
  };
