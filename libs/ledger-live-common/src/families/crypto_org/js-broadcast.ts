import type { Operation, SignedOperation, Account } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";
import { CryptoOrgErrorBroadcasting } from "./errors";

function isBroadcastTxFailure(result) {
  return !!result.code;
}

/**
 * Broadcast the signed transaction
 */
const broadcast = async ({
  account,
  signedOperation: { signature, operation },
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const broadcastResponse = await broadcastTransaction(
    signature,
    account.currency.id
  );

  if (isBroadcastTxFailure(broadcastResponse)) {
    throw new CryptoOrgErrorBroadcasting(
      `broadcasting failed with error code ${broadcastResponse.code}`
    );
  }

  return patchOperationWithHash(operation, broadcastResponse.transactionHash);
};

export default broadcast;
