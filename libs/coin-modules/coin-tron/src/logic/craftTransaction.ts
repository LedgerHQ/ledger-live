import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import { decode58Check } from "../network/format";
import { TronMemo } from "../types";
import { feesToNumber } from "./utils";

export async function craftTransaction(
  transactionIntent: TransactionIntent<TronMemo>,
  customFees?: FeeEstimation,
): Promise<string> {
  const { asset, recipient, sender, amount, expiration } = transactionIntent;
  const rawMemo = "memo" in transactionIntent ? transactionIntent.memo : undefined;

  const memo = rawMemo?.type === "string" && rawMemo.kind === "memo" ? rawMemo.value : undefined;
  const recipientAddress = decode58Check(recipient);
  const senderAddress = decode58Check(sender);

  if (asset.type === "trc20" && asset.assetReference) {
    const fees = customFees?.value;
    if (fees !== undefined && (fees <= 0 || fees > Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
      );
    }

    if (memo !== undefined) {
      throw new Error("Memo cannot be used with smart contract transactions");
    }

    const { raw_data_hex: rawDataHex } = await craftTrc20Transaction(
      asset.assetReference,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
      feesToNumber(fees),
      expiration,
    );
    return rawDataHex as string;
  } else {
    const isTransferAsset = asset.type === "trc10";
    const tokenId = asset.type === "trc10" ? asset.assetReference : undefined;
    const { raw_data_hex: rawDataHex } = await craftStandardTransaction(
      tokenId,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
      isTransferAsset,
      memo,
      expiration,
    );
    return rawDataHex as string;
  }
}
