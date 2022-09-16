import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction as apiBroadcast } from "./api";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast = async ({
  signedOperation,
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const hash = await apiBroadcast(Buffer.from(signature, "hex"));
  return patchOperationWithHash(operation, hash);
};
