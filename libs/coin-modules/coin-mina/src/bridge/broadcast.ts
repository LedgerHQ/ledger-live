import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcastTransaction } from "../logic/transaction/broadcast";
import { MinaSignedTransaction } from "../types/common";

const broadcast = async ({
  signedOperation: { signature, operation },
}: {
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const signedPayload = JSON.parse(signature) as MinaSignedTransaction;
  const hash = await broadcastTransaction(signedPayload);

  if (!hash) {
    throw new Error("mina: broadcast returned no transaction id");
  }

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
