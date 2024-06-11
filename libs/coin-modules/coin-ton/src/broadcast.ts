import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTx } from "./bridge/bridgeHelpers/api";
import { Transaction } from "./types";

const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const hash = await broadcastTx(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
