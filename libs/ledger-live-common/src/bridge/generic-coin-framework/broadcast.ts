import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { GenericTransaction } from "./types";

export const genericBroadcast: (
  network: string,
  kind: string,
) => AccountBridge<GenericTransaction>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation, rawData }, account, broadcastConfig }) => {
    const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
    const context = buildContext(account.currency.id);
    const bridgeApi = await getBridgeApi(account.currency, network);
    const send = async (signed: string) => {
      if (bridgeApi.validateTransaction) {
        const validation = await bridgeApi.validateTransaction(signed);
        if (validation.error !== undefined) {
          throw validation.error;
        }
      }
      return coinModuleApi.broadcast(context, signed, { broadcastConfig });
    };
    // A family-built operation can carry payloads to broadcast first, in order (see
    // `FamilyCraftedTransaction`); only the last one becomes the operation's hash.
    const prerequisites = Array.isArray(rawData?.prerequisites) ? rawData.prerequisites : [];
    for (const prerequisite of prerequisites) {
      if (typeof prerequisite === "string") await send(prerequisite);
    }
    const hash = await send(signature);

    return patchOperationWithHash(operation, hash);
  };
