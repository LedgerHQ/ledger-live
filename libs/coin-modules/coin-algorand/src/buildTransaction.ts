import type { SuggestedParams, Transaction as AlgoTransaction } from "algosdk";
import {
  base64ToBytes,
  encodeMsgpack,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  SignedTransaction,
} from "algosdk";

import algorandAPI from "./api";
import type { AlgoTransactionParams } from "./api";
import { extractTokenId } from "./tokens";
import type { AlgorandAccount, Transaction } from "./types";

/**
 * Convert our custom AlgoTransactionParams to algosdk v3's SuggestedParams format
 */
const toSuggestedParams = (params: AlgoTransactionParams): SuggestedParams => ({
  flatFee: false,
  fee: BigInt(params.fee),
  minFee: BigInt(params.minFee),
  firstValid: BigInt(params.firstRound),
  lastValid: BigInt(params.lastRound),
  genesisID: params.genesisID,
  genesisHash: base64ToBytes(params.genesisHash),
});

export const buildTransactionPayload = async (
  account: AlgorandAccount,
  transaction: Transaction,
): Promise<AlgoTransaction> => {
  const { amount, recipient, mode, memo, assetId, subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts && account.subAccounts.find(t => t.id === subAccountId)
    : null;

  const note = memo ? new TextEncoder().encode(memo) : undefined;

  const params = await algorandAPI.getTransactionParams();

  // Bit of safety: set tx validity to the next 1000 blocks
  const suggestedParams = toSuggestedParams({
    ...params,
    firstRound: params.lastRound,
    lastRound: params.lastRound + 1000,
  });

  let algoTxn: AlgoTransaction;
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

    algoTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: account.freshAddress,
      receiver: recipient,
      amount: amount.toNumber(),
      assetIndex: Number(targetAssetId),
      suggestedParams,
      ...(note && { note }),
    });
  } else {
    algoTxn = makePaymentTxnWithSuggestedParamsFromObject({
      sender: account.freshAddress,
      receiver: recipient,
      amount: amount.toNumber(),
      suggestedParams,
      ...(note && { note }),
    });
  }

  return algoTxn;
};

export const encodeToSign = (transaction: AlgoTransaction): string => {
  const msgPackEncoded = encodeMsgpack(transaction);

  return Buffer.from(msgPackEncoded).toString("hex");
};

// Ed25519 signature length
const ED25519_SIGNATURE_LENGTH = 64;

export const encodeToBroadcast = (transaction: AlgoTransaction, signature: Buffer): Buffer => {
  // The Ledger device may return extra bytes (APDU status word) after the signature.
  // Algorand uses Ed25519 signatures which are exactly 64 bytes.
  const sig =
    signature.length > ED25519_SIGNATURE_LENGTH
      ? new Uint8Array(signature.subarray(0, ED25519_SIGNATURE_LENGTH))
      : new Uint8Array(signature);

  // In algosdk v3, we use the SignedTransaction class to properly encode signed transactions
  const signedTxn = new SignedTransaction({
    txn: transaction,
    sig,
  });
  const msgPackEncoded = encodeMsgpack(signedTxn);

  return Buffer.from(msgPackEncoded);
};
