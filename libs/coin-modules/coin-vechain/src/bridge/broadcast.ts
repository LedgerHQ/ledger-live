import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";

import { Transaction, VechainSDKTransaction } from "../types";
import { submit } from "../network";

/**
 * Broadcast the signed transaction
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation, rawData },
}) => {
  const transaction = VechainSDKTransaction.of(
    (rawData as unknown as VechainSDKTransaction).body,
    Buffer.from(signature, "hex"),
  );
  const hash = await submit(transaction);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
