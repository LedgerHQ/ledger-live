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
    pickingStrategy?: PrepareTransferRequest["picking_strategy"];
    instrumentAdmin?: string;
  },
): Promise<{
  nativeTransaction: PrepareTransferResponse;
  serializedTransaction: string;
  hash: string;
}> {
  const params: PrepareTransferRequest = {
    type: "token-transfer-request",
    recipient: transaction.recipient || "",
    amount: transaction.amount.toFixed(),
    execute_before_secs: transaction.expireInSeconds,
    instrument_id: transaction.tokenId,
    ...(transaction.memo && { reason: transaction.memo }),
    ...(transaction.pickingStrategy && { picking_strategy: transaction.pickingStrategy }),
    ...(transaction.instrumentAdmin && { instrument_admin: transaction.instrumentAdmin }),
  };

  if (transaction.instrumentAdmin) {
    params.instrument_admin = transaction.instrumentAdmin;
  }

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
