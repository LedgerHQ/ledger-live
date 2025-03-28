import type { Account, AccountBridge, Operation, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { encodeTransaction } from "../logic/utils";
import { broadcast as broadcastLogic } from "../logic/broadcast";

const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation, rawData },
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  try {
    const tx = await encodeTransaction(rawData!, signature);
    await broadcastLogic(tx);
  } catch (e) {
    console.error("Error caught:", e);
    throw new Error(JSON.stringify(e));
  }

  return operation;
};

export default broadcast;
