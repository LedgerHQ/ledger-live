import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { broadcast as broadcastWrapper } from "../logic";

type broadcastFunc = {
  signedOperation: SignedOperation;
  account: Account;
};

const broadcast = async ({ signedOperation, account }: broadcastFunc): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const hash = await broadcastWrapper(account.currency.id, signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
