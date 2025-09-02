import BigNumber from "bignumber.js";
import { prepare, PrepareTransferResponse } from "../../network/gateway";

const encodeNativeTx = (nativeTx: PrepareTransferResponse) => JSON.stringify(nativeTx);

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
  const nativeTransaction = await prepare(account.address, {
    recipient: transaction.recipient || "",
    amount: transaction.amount.toNumber(),
    type: "token-transfer-request",
    execute_before_secs: transaction.expireInSeconds,
    instrument_id: transaction.tokenId,
  });

  const serializedTransaction = encodeNativeTx(nativeTransaction);

  return {
    nativeTransaction,
    serializedTransaction,
  };
}
