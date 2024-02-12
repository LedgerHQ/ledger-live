import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { PolkadotAPI } from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

/**
 * Broadcast the signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast =
  (polkadotAPI: PolkadotAPI) =>
  async ({
    signedOperation: { signature, operation },
  }: {
    signedOperation: SignedOperation;
  }): Promise<Operation> => {
    await loadPolkadotCrypto();
    const hash = await polkadotAPI.submitExtrinsic(signature);
    return patchOperationWithHash(operation, hash);
  };

export default broadcast;
