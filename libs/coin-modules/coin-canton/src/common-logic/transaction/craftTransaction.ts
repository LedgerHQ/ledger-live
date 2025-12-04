import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { prepareTransferRequest } from "../../network/gateway";
import type { PrepareTransferRequest, PrepareTransferResponse } from "../../types/gateway";

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
    memo?: string;
  },
): Promise<{
  nativeTransaction: PrepareTransferResponse;
  serializedTransaction: string;
  hash: string;
}> {
  const params: PrepareTransferRequest = {
    recipient: transaction.recipient || "",
    amount: transaction.amount.toFixed(),
    type: "token-transfer-request" as const,
    execute_before_secs: transaction.expireInSeconds,
    instrument_id: transaction.tokenId,
  };

  if (transaction.memo) {
    params.reason = transaction.memo;
  }

  const { serialized, json, hash } = await prepareTransferRequest(
    currency,
    account.address,
    params,
  );

  return {
    nativeTransaction: json,
    serializedTransaction: serialized,
    hash,
  };
}
