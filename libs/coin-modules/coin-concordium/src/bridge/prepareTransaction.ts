import {
  AccountAddress,
  AccountTransactionType,
  CcdAmount,
} from "@ledgerhq/concordium-sdk-adapter";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
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
    const toAddress = account.freshAddress
      ? AccountAddress.fromBase58(account.freshAddress)
      : AccountAddress.fromBase58(getAbandonSeedAddress(account.currency.id));

    payload = {
      amount: CcdAmount.fromMicroCcd("0"),
      toAddress,
      memo: encodeMemoToDataBlob(transaction.memo),
    };
  }

  const estimation = await estimateFees("", account.currency, transactionType, payload);

  if (!transaction.fee || !transaction.fee.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
