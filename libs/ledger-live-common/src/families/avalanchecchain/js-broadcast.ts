import { patchOperationWithHash } from "../../operation";
import { web3Client } from "./api/client";

const broadcast = async ({ signedOperation: { operation, signature } }) => {
    const hash = await web3Client().eth.sendSignedTransaction(signature);
    return patchOperationWithHash(operation, hash.transactionHash);
};

export default broadcast;
