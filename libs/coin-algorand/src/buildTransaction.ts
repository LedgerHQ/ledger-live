import { encode as msgpackEncode } from "algo-msgpack-with-bigint";
import type {
  EncodedSignedTransaction as AlgoSignedTransactionPayload,
  Transaction as AlgoTransaction,
  EncodedTransaction as AlgoTransactionPayload,
} from "algosdk";
import {
  makeAssetTransferTxnWithSuggestedParams,
  makePaymentTxnWithSuggestedParams,
} from "algosdk";

import type { Account } from "@ledgerhq/types-live";
import algorandAPI from "./api";
import { extractTokenId } from "./tokens";
import type { Transaction } from "./types";

export const buildTransactionPayload = async (
  account: Account,
  transaction: Transaction,
): Promise<AlgoTransactionPayload> => {
  const { amount, recipient, mode, memo, assetId, subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts && account.subAccounts.find(t => t.id === subAccountId)
    : null;

  const note = memo ? new TextEncoder().encode(memo) : undefined;

  const params = await algorandAPI.getTransactionParams();

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

    algoTxn = makeAssetTransferTxnWithSuggestedParams(
      account.freshAddress,
      recipient,
      undefined,
      undefined,
      amount.toNumber(),
      note,
      Number(targetAssetId),
      params,
      undefined,
    );
  } else {
    algoTxn = makePaymentTxnWithSuggestedParams(
      account.freshAddress,
      recipient,
      amount.toNumber(),
      undefined,
      note,
      params,
    );
  }

  // Bit of safety: set tx validity to the next 1000 blocks
  algoTxn.firstRound = params.lastRound;
  algoTxn.lastRound = params.lastRound + 1000;

  // Flaw in the SDK: payload isn't sorted, but it needs to be for msgPack encoding
  const sorted = Object.fromEntries(
    Object.entries(algoTxn.get_obj_for_encoding()).sort(),
  ) as AlgoTransactionPayload;

  return sorted;
};

export const encodeToSign = (payload: AlgoTransactionPayload): string => {
  const msgPackEncoded = msgpackEncode(payload);

  return Buffer.from(msgPackEncoded).toString("hex");
};

export const encodeToBroadcast = (payload: AlgoTransactionPayload, signature: Buffer): Buffer => {
  const signedPayload: AlgoSignedTransactionPayload = {
    sig: signature,
    txn: payload,
  };
  const msgPackEncoded = msgpackEncode(signedPayload);

  return Buffer.from(msgPackEncoded);
};
