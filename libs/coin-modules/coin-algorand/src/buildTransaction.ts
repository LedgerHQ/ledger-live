import type { Transaction as AlgoTransaction } from "algosdk";
import {
  encodeMsgpack,
  base64ToBytes,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk";

import { getTransactionParams } from "./network";
import { extractTokenId } from "./tokens";
import type { AlgorandAccount, Transaction } from "./types";

export const buildTransactionPayload = async (
  account: AlgorandAccount,
  transaction: Transaction,
): Promise<AlgoTransaction> => {
  const { amount, recipient, mode, memo, assetId, subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts && account.subAccounts.find(t => t.id === subAccountId)
    : null;

  const note = memo ? new TextEncoder().encode(memo) : undefined;

  const params = await getTransactionParams();
  const suggestedParams = {
    ...params,
    firstValid: params.lastRound,
    lastValid: params.lastRound + 1000,
    genesisHash: base64ToBytes(params.genesisHash),
  };

  if (subAccount || (assetId && mode === "optIn")) {
    const targetAssetId =
      subAccount && subAccount.type === "TokenAccount"
        ? extractTokenId(subAccount.token.id)
        : assetId
          ? extractTokenId(assetId)
          : "";

    if (!targetAssetId) {
      throw new Error("Token Asset Id not found");
    }

    return makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: account.freshAddress,
      receiver: recipient,
      amount: amount.toNumber(),
      assetIndex: Number(targetAssetId),
      suggestedParams,
      ...(note ? { note } : {}),
    });
  }

  return makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.freshAddress,
    receiver: recipient,
    amount: amount.toNumber(),
    suggestedParams,
    ...(note ? { note } : {}),
  });
};

export const encodeToSign = (payload: AlgoTransaction): string => {
  const msgPackEncoded = encodeMsgpack(payload);

  return Buffer.from(msgPackEncoded).toString("hex");
};

export const encodeToBroadcast = (payload: AlgoTransaction, signature: Buffer): Buffer => {
  // App Algorand returns 66 bytes signatures, including the status word
  // ED25519 signature length is exactly 64 bytes
  const ED25519_SIGNATURE_LENGTH = 64;

  const signedPayload = new SignedTransaction({
    sig: signature.subarray(0, ED25519_SIGNATURE_LENGTH),
    txn: payload,
  });
  const msgPackEncoded = encodeMsgpack(signedPayload);

  return Buffer.from(msgPackEncoded);
};
