import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { KaspaTransaction } from "../types/bridge";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<KaspaTransaction>["broadcast"] = async ({ signedOperation }) => {
  const { signature, operation } = signedOperation;
  const hash = "deadbeef"
  return patchOperationWithHash(operation, hash);
};
