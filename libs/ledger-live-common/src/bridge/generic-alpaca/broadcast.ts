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
    const hash = await getAlpacaApi(account.currency.id, kind).broadcast(
      signature,
      broadcastConfig,
    );

    return patchOperationWithHash(operation, hash);
  };
