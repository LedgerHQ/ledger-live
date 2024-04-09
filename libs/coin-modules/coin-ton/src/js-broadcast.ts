import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { BroadcastFnSignature } from "@ledgerhq/types-live";
import { broadcastTx } from "./bridge/bridgeHelpers/api";

const broadcast: BroadcastFnSignature = async ({ signedOperation: { signature, operation } }) => {
  const hash = await broadcastTx(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
