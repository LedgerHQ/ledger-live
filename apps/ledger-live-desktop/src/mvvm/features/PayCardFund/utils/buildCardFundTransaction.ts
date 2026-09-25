import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/coin-modules/transaction-types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { transactionStrategy } from "@ledgerhq/live-common/exchange/swap/transactionStrategies";
import { decodeFundPayload } from "@ledgerhq/hw-app-exchange";
import BigNumber from "bignumber.js";

type BuildCardFundTransactionParams = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  amount: BigNumber;
  payinAddress: string;
  binaryPayload: string;
}>;

export async function buildCardFundTransaction({
  account,
  parentAccount,
  amount,
  payinAddress,
  binaryPayload,
}: BuildCardFundTransactionParams): Promise<Transaction> {
  const mainAccount = getMainAccount(account, parentAccount);
  const family = mainAccount.currency.family as Transaction["family"];
  const strategy = transactionStrategy[family];

  if (!strategy) {
    throw new Error(`Card Fund does not support ${family}`);
  }

  const payload = await decodeFundPayload(binaryPayload);
  const transaction = strategy({
    family,
    amount,
    recipient: payinAddress,
    customFeeConfig: {},
    payinExtraId: payload.inExtraId,
  });
  const accountBridge = await getAccountBridge(account, parentAccount);
  const subAccountId = parentAccount && parentAccount.id !== account.id ? account.id : undefined;
  const bridgeTransaction = accountBridge.createTransaction(account);

  return accountBridge.updateTransaction(
    { ...bridgeTransaction, recipient: payinAddress },
    { ...transaction, feesStrategy: "medium", subAccountId },
  ) as Transaction;
}
