import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { AptosAPI } from "../network";

type broadcastFunc = {
  signedOperation: SignedOperation;
  account: Account;
};

const broadcast = async ({ signedOperation, account }: broadcastFunc): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const client = new AptosAPI(account.currency.id);
  const hash = await client.broadcast(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
