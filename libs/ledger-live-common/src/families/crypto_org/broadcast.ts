import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { broadcastTransaction } from "./api";
import { CryptoOrgErrorBroadcasting } from "./errors";
import { Transaction } from "./types";

function isBroadcastTxFailure(result) {
  return !!result.code;
}

/**
 * Broadcast the signed transaction
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const broadcastResponse = await broadcastTransaction(signature, account.currency.id);

  if (isBroadcastTxFailure(broadcastResponse)) {
    throw new CryptoOrgErrorBroadcasting(
      `broadcasting failed with error code ${broadcastResponse.code}`,
    );
  }

  return patchOperationWithHash(operation, broadcastResponse.transactionHash);
};

export default broadcast;
