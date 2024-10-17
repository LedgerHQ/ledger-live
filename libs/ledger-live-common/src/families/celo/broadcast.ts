import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { Transaction } from "./types";
import { celoKit } from "./api/sdk";
import { recoverTransaction } from "@celo/wallet-base";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}) => {
  const kit = celoKit();
  console.info("niconico tx rlp with sig", signature, "recovered", recoverTransaction(signature));
  const { transactionHash } = await kit.web3.eth.sendSignedTransaction(signature);
  return patchOperationWithHash(operation, transactionHash);
};

export default broadcast;
