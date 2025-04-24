import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset, AptosExtra, AptosSender } from "../types/assets";
import type { Account } from "@ledgerhq/types-live";
import type { AptosAPI } from "../network";
import buildTransaction from "./buildTransaction";
import createTransaction from "./createTransaction";
import BigNumber from "bignumber.js";
import { DEFAULT_GAS_PRICE } from "../constants";
import { DEFAULT_MAX_GAS_AMOUNT } from "@aptos-labs/ts-sdk";

export async function craftTransaction(
  aptosClient: AptosAPI,
  transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender>,
  _customFees?: bigint,
): Promise<string> {
  const account = {
    freshAddress: transactionIntent.sender.freshAddress,
    xpub: transactionIntent.sender.xpub,
  } as Account;

  const newTx = createTransaction();
  newTx.amount = BigNumber(transactionIntent.amount.toString());
  newTx.recipient = transactionIntent.recipient;
  newTx.mode = transactionIntent.type;
  newTx.options.gasUnitPrice = DEFAULT_GAS_PRICE.toString();
  newTx.options.maxGasAmount = DEFAULT_MAX_GAS_AMOUNT.toString();

  const aptosTx = await buildTransaction(account, newTx, aptosClient);

  return aptosTx.bcsToHex().toString();
}
