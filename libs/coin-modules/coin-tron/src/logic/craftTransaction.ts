import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import { decode58Check } from "../network/format";
import { TronToken } from "../types";
import { feesToNumber } from "./utils";

type TransactionIntentExtra = {
  /** Memo value. */
  memo?: string;

  /** Expiration in seconds after crafting time. */
  expiration?: number;
};

export async function craftTransaction(
  transactionIntent: TransactionIntent<TronToken>,
  customFees?: bigint,
): Promise<string> {
  const { asset, recipient, sender, amount } = transactionIntent;
  const { memo, expiration } = transactionIntent as TransactionIntentExtra;
  const recipientAddress = decode58Check(recipient);
  const senderAddress = decode58Check(sender);

  if (asset?.standard === "trc20" && asset.contractAddress) {
    if (customFees !== undefined && (customFees <= 0 || customFees > Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
      );
    }

    if (memo !== undefined) {
      throw new Error("Memo cannot be used with smart contract transactions");
    }

    const { raw_data_hex: rawDataHex } = await craftTrc20Transaction(
      asset.contractAddress,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
      feesToNumber(customFees),
      expiration,
    );
    return rawDataHex as string;
  } else {
    const isTransferAsset = asset?.standard === "trc10";
    const tokenId = asset?.standard === "trc10" ? asset.tokenId : undefined;
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
