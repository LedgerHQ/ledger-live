import type { BroadcastFnSignature, Operation } from "../../types";
import { patchOperationWithHash } from "../../operation";
import { submit } from "./api";

/**
 * Broadcast the signed transaction
 * @param {signedOperation: string, account: Account}
 * @returns Operation
 */
const broadcast: BroadcastFnSignature = async ({
  signedOperation,
  account,
}): Promise<Operation> => {
  const { hash } = await submit(signedOperation.signature, account.currency);
  return patchOperationWithHash(signedOperation.operation, hash);
};

export default broadcast;
