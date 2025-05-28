import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset, AptosExtra, AptosSender } from "../types/assets";
import type { Account } from "@ledgerhq/types-live";
import type { AptosAPI } from "../network";
import buildTransaction from "./buildTransaction";
import createTransaction from "./createTransaction";
import BigNumber from "bignumber.js";

export async function craftTransaction(
  aptosClient: AptosAPI,
  transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>,
): Promise<string> {
  const account = {
    freshAddress: transactionIntent.sender.freshAddress,
    xpub: transactionIntent.sender.xpub,
  } as Account;

  const newTx = createTransaction();
  newTx.amount = BigNumber(transactionIntent.amount.toString());
  newTx.recipient = transactionIntent.recipient;
  newTx.mode = transactionIntent.type;

  const aptosTx = await buildTransaction(account, newTx, aptosClient);

  return aptosTx.bcsToHex().toString();
}
