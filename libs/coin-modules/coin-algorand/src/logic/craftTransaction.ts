import type {
  TransactionIntent,
  CraftedTransaction,
  FeeEstimation,
} from "@ledgerhq/coin-module-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-module-framework/utils";
import type { Transaction as AlgoTx } from "algosdk";
import {
  base64ToBytes,
  encodeMsgpack,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk";
import type { AlgorandContext, AlgorandCoinConfig } from "../config";
import { getTransactionParams } from "../network";
import type { AlgorandMemo } from "../types";
import { estimateFees } from "./estimateFees";

export type CraftedAlgorandTransaction = {
  serializedTransaction: string;
  txPayload: Record<string, unknown>;
};

/**
 * Craft an unsigned Algorand transaction
 * @param config - The resolved coin configuration
 * @param input - Transaction parameters
 * @returns Serialized unsigned transaction and payload
 */
export async function craftTransaction(
  config: AlgorandCoinConfig,
  input: {
    sender: string;
    recipient: string;
    amount: bigint;
    memo?: string | undefined;
    assetId?: string | undefined;
    fees?: bigint | undefined;
  },
): Promise<CraftedAlgorandTransaction> {
  const { sender, recipient, amount, memo, assetId, fees } = input;

  const note = memo ? new TextEncoder().encode(memo) : undefined;
  const params = await getTransactionParams(config);

  if (typeof fees === "bigint") {
    params.fee = 0;
    params.minFee = Number(fees);
  }

  const suggestedParams = {
    ...params,
    firstValid: params.lastRound,
    lastValid: params.lastRound + 1000,
    genesisHash: base64ToBytes(params.genesisHash),
  };

  const algoTxn: AlgoTx = assetId
    ? makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender,
        receiver: recipient,
        amount: Number(amount),
        assetIndex: Number(assetId),
        suggestedParams,
        ...(note ? { note } : {}),
      })
    : makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver: recipient,
        amount: Number(amount),
        suggestedParams,
        ...(note ? { note } : {}),
      });

  const msgPackEncoded = encodeMsgpack(algoTxn);
  const serializedTransaction = Buffer.from(msgPackEncoded).toString("hex");

  return {
    serializedTransaction,
    txPayload: algoTxn as unknown as Record<string, unknown>,
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
  config: AlgorandCoinConfig,
  sender: string,
  assetId: string,
  fees?: bigint,
): Promise<CraftedAlgorandTransaction> {
  return craftTransaction(config, {
    sender,
    recipient: sender, // Opt-in sends to self
    amount: 0n,
    assetId,
    fees,
  });
}

export async function craftApiTransaction(
  context: AlgorandContext,
  transactionIntent: TransactionIntent<AlgorandMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(transactionIntent)) {
    throw new Error("Only send transaction intent is supported");
  }

  const config = await context.config();
  const fees = customFees?.value ?? (await estimateFees(context)).value;

  const memo = transactionIntent.memo?.type === "string" ? transactionIntent.memo.value : undefined;

  const assetId =
    transactionIntent.asset.type === "asa" ? transactionIntent.asset.assetReference : undefined;

  const result = await craftTransaction(config, {
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
