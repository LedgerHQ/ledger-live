import { Account, Operation, SignedOperation } from "../../types";
import * as hedera from "@hashgraph/sdk";
import { broadcastTransaction } from "./api/network";
import { patchOperationWithHash } from "../../operation";

export default async function broadcast({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> {
  let { signature, operation } = signedOperation;

  // NOTE: expecting a serialized transaction to be signedOperation.signature (in hex)
  let hederaTransaction = hedera.Transaction.fromBytes(Buffer.from(signature, "base64"));

  let response = await broadcastTransaction(hederaTransaction);

  return patchOperationWithHash(operation, Buffer.from(response.transactionHash).toString("base64"));
}
