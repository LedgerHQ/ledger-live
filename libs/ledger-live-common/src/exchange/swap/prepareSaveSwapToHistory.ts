import { Account, AccountLike, TokenAccount, SwapOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getParentAccount } from "../../account/helpers";

export type PrepareSaveSwapProps = {
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
  swapId?: string;
  transactionId: string;
};

export function prepareSaveSwapToHistory(
  accounts: AccountLike[],
  {
    provider,
    fromAccountId,
    toAccountId,
    fromAmount,
    toAmount,
    swapId,
    transactionId,
  }: PrepareSaveSwapProps,
): {
  accountId: string;
  updater: (account: Account) => Account;
} {
  if (!transactionId || !provider || !fromAmount || !toAmount || !swapId) {
    throw new Error("Cannot save swap missing params");
  }

  const operationId = `${fromAccountId}-${transactionId}-OUT`;

  const fromAccount = accounts.find(acc => acc.id === fromAccountId);
  const toAccount = accounts.find(acc => acc.id === toAccountId);

  if (!fromAccount || !toAccount) {
    throw new Error(`accountId ${fromAccountId} unknown`);
  }

  const accountId =
    fromAccount.type === "TokenAccount"
      ? getParentAccount(fromAccount, accounts).id
      : fromAccountId;

  const swapOperation: SwapOperation = {
    status: "pending",
    provider,
    operationId,
    swapId,
    receiverAccountId: toAccountId,
    tokenId: toAccountId,
    fromAmount,
    toAmount,
  };

  const updater = (account: Account): Account => {
    if (account.id === fromAccountId) {
      return {
        ...account,
        swapHistory: [...account.swapHistory, swapOperation],
      };
    }

    return {
      ...account,
      subAccounts: account.subAccounts?.map<TokenAccount>(a =>
        a.id === fromAccountId ? { ...a, swapHistory: [...a.swapHistory, swapOperation] } : a,
      ),
    };
  };

  return { accountId, updater };
}
