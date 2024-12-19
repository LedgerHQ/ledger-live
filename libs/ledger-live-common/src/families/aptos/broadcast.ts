import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "./../../operation";
import { AptosAPI } from "./api";

const broadcast = async ({
  signedOperation,
  account,
}: {
  signedOperation: SignedOperation;
  account: Account;
}): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const hash = await new AptosAPI(account.currency.id).broadcast(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
