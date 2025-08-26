import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { getAlpacaApi } from "./alpaca";
import { decodeAccountId } from "../../account";

export const genericBroadcast: (network, kind) => AccountBridge<TransactionCommon>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation } }) => {
    const decoded = decodeAccountId(operation.accountId);
    const hash = await getAlpacaApi(
      network,
      kind,
      decoded.xpubOrAddress,
      decoded.xpubOrAddress,
    ).broadcast(signature);

    return patchOperationWithHash(operation, hash);
  };
