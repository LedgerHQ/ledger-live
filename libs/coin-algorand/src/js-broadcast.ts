import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { AlgorandAPI } from "./api";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast =
  (algorandAPI: AlgorandAPI) =>
  async ({
    signedOperation,
  }: {
    signedOperation: SignedOperation;
  }): Promise<Operation> => {
    const { signature, operation } = signedOperation;
    const hash = await algorandAPI.broadcastTransaction(
      Buffer.from(signature, "hex")
    );
    return patchOperationWithHash(operation, hash);
  };
