import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { KaspaTransaction } from "../types/bridge";
import { submitTransaction } from "../network";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<KaspaTransaction>["broadcast"] = async ({
  signedOperation,
}) => {
  const { signature, operation } = signedOperation;
  const hash = (await submitTransaction(signature)).txId;
  return patchOperationWithHash(operation, hash);
};
