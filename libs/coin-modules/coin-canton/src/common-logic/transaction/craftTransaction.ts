import BigNumber from "bignumber.js";
import { prepareTransferRequest, PrepareTransferResponse } from "../../network/gateway";

export async function craftTransaction(
  account: {
    address: string;
    nextSequenceNumber?: number;
    publicKey?: string;
  },
  transaction: {
    recipient?: string;
    amount: BigNumber;
    tokenId: string;
    expireInSeconds: number;
  },
): Promise<{
  nativeTransaction: PrepareTransferResponse;
  serializedTransaction: string;
}> {
  const { serialized, json } = await prepareTransferRequest(account.address, {
    recipient: transaction.recipient || "",
    amount: transaction.amount.toNumber(),
    type: "token-transfer-request",
    execute_before_secs: transaction.expireInSeconds,
    instrument_id: transaction.tokenId,
  });

  return {
    nativeTransaction: json,
    serializedTransaction: serialized,
  };
}
