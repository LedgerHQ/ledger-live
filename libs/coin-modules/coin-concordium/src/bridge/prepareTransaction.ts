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
  const transactionType = transaction.memo
    ? AccountTransactionType.TransferWithMemo
    : AccountTransactionType.Transfer;

  const toAddress = transaction.recipient
    ? AccountAddress.fromBase58(transaction.recipient)
    : account.freshAddress
      ? AccountAddress.fromBase58(account.freshAddress)
      : AccountAddress.fromBase58(getAbandonSeedAddress(account.currency.id));

  const payload = {
    amount: CcdAmount.fromMicroCcd(transaction.amount.toString()),
    toAddress,
    ...(transaction.memo ? { memo: encodeMemoToDataBlob(transaction.memo) } : {}),
  };

  const estimation = await estimateFees("", account.currency, transactionType, payload);

  if (!transaction.fee || !transaction.fee.isEqualTo(new BigNumber(estimation.cost.toString()))) {
    return { ...transaction, fee: new BigNumber(estimation.cost.toString()) };
  }

  return transaction;
};
