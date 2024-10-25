import invariant from "invariant";
import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { StacksOperation, Transaction } from "../types";
import { getTxToBroadcast } from "./utils/misc";
import { broadcastTx } from "../network/api";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature, rawData },
}) => {
  invariant(operation as StacksOperation, "StacksOperation expected");
  const tx = await getTxToBroadcast(operation as StacksOperation, signature, rawData ?? {});

  const hash = await broadcastTx(tx);
  const result = patchOperationWithHash(operation, hash);

  return result;
};
