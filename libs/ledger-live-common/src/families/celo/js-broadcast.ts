import { patchOperationWithHash } from "../../operation";
import { celoKit } from "./api/sdk";

const broadcast = async ({ signedOperation: { operation, signature } }) => {
  const kit = celoKit();
  const { transactionHash } = await kit.web3.eth.sendSignedTransaction(signature);
  return patchOperationWithHash(operation, transactionHash);
};

export default broadcast;
