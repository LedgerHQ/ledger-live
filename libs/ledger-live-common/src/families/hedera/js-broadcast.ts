import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import * as hedera from "@hashgraph/sdk";
import { broadcastTransaction } from "./api/network";
import { patchOperationWithHash } from "../../operation";
import { base64ToUrlSafeBase64 } from "./utils";

export default async function broadcast({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> {
  const { signature, operation } = signedOperation;

  // NOTE: expecting a serialized transaction to be signedOperation.signature (in hex)
  const hederaTransaction = hedera.Transaction.fromBytes(
    Buffer.from(signature, "base64")
  );

  const response = await broadcastTransaction(hederaTransaction);

  const base64Hash = Buffer.from(response.transactionHash).toString("base64");
  const base64HashUrlSafe = base64ToUrlSafeBase64(base64Hash);

  return patchOperationWithHash(operation, base64HashUrlSafe);
}
