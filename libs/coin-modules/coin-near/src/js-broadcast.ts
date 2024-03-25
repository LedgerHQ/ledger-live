import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcastTransaction } from "./api";

const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const hash = await broadcastTransaction(signature);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
