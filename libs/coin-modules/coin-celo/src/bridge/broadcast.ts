import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import { celoKit } from "../network/sdk";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}) => {
  const kit = celoKit();
  const { transactionHash } = await kit.web3.eth.sendSignedTransaction(signature);
  return patchOperationWithHash(operation, transactionHash);
};

export default broadcast;
