import BigNumber from "bignumber.js";
import { prepareTransferRequest, PrepareTransferResponse } from "../../network/gateway";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function craftTransaction(
  currency: CryptoCurrency,
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
    memo?: string | undefined;
  },
): Promise<{
  nativeTransaction: PrepareTransferResponse;
  serializedTransaction: string;
  hash: string;
}> {
  const { serialized, json, hash } = await prepareTransferRequest(currency, account.address, {
    recipient: transaction.recipient || "",
    amount: transaction.amount.toString(),
    type: "token-transfer-request",
    execute_before_secs: transaction.expireInSeconds,
    instrument_id: transaction.tokenId,
    reason: transaction.memo,
  });

  return {
    nativeTransaction: json,
    serializedTransaction: serialized,
    hash,
  };
}
