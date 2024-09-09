import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcastTransaction } from "./api";
import { MinaSignedTransaction } from "./types";

const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const signedPayload = JSON.parse(signature) as MinaSignedTransaction;
  const hash = await broadcastTransaction(signedPayload);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
