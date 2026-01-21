import {
  AccountAddress,
  AccountTransactionType,
  CcdAmount,
} from "@ledgerhq/concordium-sdk-adapter";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees } from "../common-logic";
import { encodeMemoToDataBlob } from "../common-logic/utils";
import { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  // Determine transaction type and payload based on memo
  const transactionType = transaction.memo
    ? AccountTransactionType.TransferWithMemo
    : AccountTransactionType.Transfer;

  let payload;
  if (transaction.memo) {
    // Create a payload for fee estimation with memo
    // Note: We use a dummy amount and recipient for estimation, only memo size matters
    const dummyAmount = CcdAmount.fromMicroCcd("0");
    const dummyRecipient = account.freshAddress
      ? AccountAddress.fromBase58(account.freshAddress)
      : AccountAddress.fromBase58("3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P");

    payload = {
      amount: dummyAmount,
      toAddress: dummyRecipient,
      memo: encodeMemoToDataBlob(transaction.memo),
    };
  }

  const estimation = await estimateFees("", account.currency, transactionType, payload);

  if (!transaction.fee || !transaction.fee.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
