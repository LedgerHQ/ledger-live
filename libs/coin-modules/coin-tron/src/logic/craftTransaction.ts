import { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { decode58Check } from "../network/format";
import BigNumber from "bignumber.js";
import { craftStandardTransaction, craftTrc20Transaction } from "../network";

export async function craftTransaction(transactionIntent: TransactionIntent): Promise<string> {
  const { standard, tokenAddress, recipient, sender, amount } = transactionIntent;
  const recipientAddress = decode58Check(recipient);
  const senderAddress = decode58Check(sender);

  if (standard === "trc20" && tokenAddress) {
    const { raw_data_hex: rawDataHex } = await craftTrc20Transaction(
      tokenAddress,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
    );
    return rawDataHex as string;
  } else {
    const isTransferAsset = Boolean(tokenAddress && tokenAddress.length > 0);
    const { raw_data_hex: rawDataHex } = await craftStandardTransaction(
      tokenAddress,
      recipientAddress,
      senderAddress,
      new BigNumber(amount.toString()),
      isTransferAsset,
    );
    return rawDataHex as string;
  }
}
