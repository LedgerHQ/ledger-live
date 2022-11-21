import { patchOperationWithHash } from "../../operation";
import { avalancheClient } from "./api/client";

const broadcast = async ({ signedOperation: { operation, signature } }) => {
  const hash = await avalancheClient().PChain().issueTx(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
