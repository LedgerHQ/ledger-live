import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { decode58Check } from "../network/format";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";
import { TronToken } from "../types";

export async function craftTransaction(
  transactionIntent: TransactionIntent<TronToken>,
): Promise<string> {
  const { asset, recipient, sender, amount } = transactionIntent;
  const recipientAddress = decode58Check(recipient);
  const senderAddress = decode58Check(sender);

  if (asset?.standard === "trc20" && asset.contractAddress) {
    const { raw_data_hex: rawDataHex } = await craftTrc20Transaction(
      asset.contractAddress,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
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
    );
    return rawDataHex as string;
  }
}
