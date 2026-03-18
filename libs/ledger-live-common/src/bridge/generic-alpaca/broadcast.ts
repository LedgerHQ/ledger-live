import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { getAlpacaApi } from "./alpaca";
import { GenericTransaction } from "./types";

export const genericBroadcast: (
  network: string,
  kind: string,
) => AccountBridge<GenericTransaction>["broadcast"] =
  (_network, kind) =>
  async ({ signedOperation: { signature, operation }, account, broadcastConfig }) => {
    const api = getAlpacaApi(account.currency.id, kind);
    if (api.validateTransaction) {
      const validation = await api.validateTransaction(signature);
      if (validation.error !== undefined) {
        throw validation.error;
      }
    }
    const hash = await api.broadcast(signature, broadcastConfig);

    return patchOperationWithHash(operation, hash);
  };
