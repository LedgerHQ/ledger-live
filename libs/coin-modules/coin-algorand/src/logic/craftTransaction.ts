import type {
  TransactionIntent,
  CraftedTransaction,
  FeeEstimation,
} from "@ledgerhq/coin-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import { encode as msgpackEncode } from "algo-msgpack-with-bigint";
import type { EncodedTransaction as AlgoTransactionPayload, Transaction as AlgoTx } from "algosdk";
import {
  makeAssetTransferTxnWithSuggestedParams,
  makePaymentTxnWithSuggestedParams,
} from "algosdk";
import { getTransactionParams } from "../network";
import type { AlgorandMemo } from "../types";
import { estimateFees } from "./estimateFees";

export type CraftedAlgorandTransaction = {
  serializedTransaction: string;
  txPayload: AlgoTransactionPayload;
};

/**
 * Craft an unsigned Algorand transaction
 * @param input - Transaction parameters
 * @returns Serialized unsigned transaction and payload
 */
export async function craftTransaction(input: {
  sender: string;
  recipient: string;
  amount: bigint;
  memo?: string | undefined;
  assetId?: string | undefined;
  fees?: bigint | undefined;
}): Promise<CraftedAlgorandTransaction> {
  const { sender, recipient, amount, memo, assetId, fees } = input;

  const note = memo ? new TextEncoder().encode(memo) : undefined;
  const params = await getTransactionParams();

  if (typeof fees === "bigint") {
    params.fee = 0; // Set to 0 to use flatFee
    params.minFee = Number(fees);
  }

  const algoTxn: AlgoTx = assetId ? makeAssetTransferTxnWithSuggestedParams(
    sender,
    recipient,
    undefined, // closeRemainderTo
    undefined, // revocationTarget
    Number(amount),
    note,
    Number(assetId),
    params,
    undefined, // rekeyTo
  ) : makePaymentTxnWithSuggestedParams(
    sender,
    recipient,
    Number(amount),
    undefined, // closeRemainderTo
    note,
    params,
  );

  // Set transaction validity window (next 1000 blocks)
  algoTxn.firstRound = params.lastRound;
  algoTxn.lastRound = params.lastRound + 1000;

  // SDK flaw: payload is not sorted but needs to be for msgpack encoding
  const sorted = Object.fromEntries(
    Object.entries(algoTxn.get_obj_for_encoding()).sort(),
  ) as AlgoTransactionPayload;

  // Serialize for signing
  const msgPackEncoded = msgpackEncode(sorted);
  const serializedTransaction = Buffer.from(msgPackEncoded).toString("hex");

  return {
    serializedTransaction,
    txPayload: sorted,
  };
}

/**
 * Craft an opt-in transaction for an ASA token
 * @param sender - The sender address (also recipient for opt-in)
 * @param assetId - The ASA token ID to opt into
 * @param fees - Optional fee override
 * @returns Serialized unsigned transaction
 */
export async function craftOptInTransaction(
  sender: string,
  assetId: string,
  fees?: bigint,
): Promise<CraftedAlgorandTransaction> {
  return craftTransaction({
    sender,
    recipient: sender, // Opt-in sends to self
    amount: 0n,
    assetId,
    fees,
  });
}

export async function craftApiTransaction(
  transactionIntent: TransactionIntent<AlgorandMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(transactionIntent)) {
    throw new Error("Only send transaction intent is supported");
  }

  const fees = customFees?.value ?? (await estimateFees()).value;

  const memo = transactionIntent.memo?.type === "string" ? transactionIntent.memo.value : undefined;

  const assetId =
    transactionIntent.asset.type === "asa" ? transactionIntent.asset.assetReference : undefined;

  const result = await craftTransaction({
    sender: transactionIntent.sender,
    recipient: transactionIntent.recipient,
    amount: transactionIntent.amount,
    memo,
    assetId,
    fees,
  });

  return {
    transaction: result.serializedTransaction,
    details: {
      txPayload: result.txPayload,
    },
  };
}
