import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { getAlpacaApi } from "./alpaca";

export const genericBroadcast: (network, kind) => AccountBridge<TransactionCommon>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation } }) => {
    const hash = await getAlpacaApi(network, kind).broadcast(signature);

    return patchOperationWithHash(operation, hash);
  };
