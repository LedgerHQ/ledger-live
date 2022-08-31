import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import { broadcastTransaction } from "./api/rpc";
import { encodeOperationId } from "../../operation";
import { Transaction as EvmTransaction } from "./types";

/**
 * Broadcast a transaction and update the operation linked
 */
export const broadcast: AccountBridge<EvmTransaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const txResponse = await broadcastTransaction(account.currency, signature);

  return {
    ...operation,
    id: encodeOperationId(operation.accountId, txResponse.hash, "OUT"),
    hash: txResponse.hash,
    blockNumber: txResponse.blockNumber,
    blockHeight: txResponse.blockNumber,
    blockHash: txResponse.blockHash,
    date: new Date(
      txResponse.timestamp ? txResponse.timestamp * 1000 : Date.now()
    ),
  } as Operation;
};

export default broadcast;
