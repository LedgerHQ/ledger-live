import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { getAlpacaApi } from "./alpaca";

export const genericBroadcast: (network, kind) => AccountBridge<TransactionCommon>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation }, account, broadcastConfig }) => {
    const hash = await getAlpacaApi(account.currency.id, kind).broadcast(
      signature,
      broadcastConfig,
    );

    return patchOperationWithHash(operation, hash);
  };
