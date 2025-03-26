import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "./types";
import { celoKit } from "./api/sdk";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}) => {
  debugger;
  const kit = celoKit();
  const { transactionHash } = await kit.web3.eth.sendSignedTransaction(signature);
  return patchOperationWithHash(operation, transactionHash);
};

export default broadcast;
