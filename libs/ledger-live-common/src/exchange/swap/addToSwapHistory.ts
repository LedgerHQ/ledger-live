import type { Transaction } from "../../generated/types";
import type { ExchangeSwap, ExchangeRate } from "./types";
import { getAccountCurrency, getMainAccount } from "../../account";
import type { Account, Operation, TokenAccount, SwapOperation } from "@ledgerhq/types-live";

export default ({
  account,
  operation,
  transaction,
  swap,
  swapId,
}: {
  account: Account;
  operation: Operation;
  transaction: Transaction;
  swap: {
    exchange: ExchangeSwap;
    exchangeRate: ExchangeRate;
  };
  swapId: string;
}): Account => {
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, toParentAccount } = exchange;
  const mainToAccount = getMainAccount(toAccount, toParentAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const fromCurrency = getAccountCurrency(fromAccount);
  const subAccounts = account.type === "Account" && account.subAccounts;
  const tokenId = toCurrency.type === "TokenCurrency" ? toCurrency.id : undefined;
  const isFromToken = fromCurrency.type === "TokenCurrency";
  const operationId =
    isFromToken && operation.subOperations && operation.subOperations.length > 0
      ? operation.subOperations[0].id
      : operation.id;

  const toAmount = transaction.amount.times(exchangeRate.magnitudeAwareRate);

  const swapOperation: SwapOperation = {
    status: "pending",
    provider: exchangeRate.provider,
    operationId,
    swapId,
    // NB We store the reciever main account + tokenId in case the token account doesn't exist yet.
    receiverAccountId: mainToAccount.id,
    tokenId,
    fromAmount: transaction.amount,
    toAmount,
  };
  return isFromToken && subAccounts
    ? {
        ...account,
        subAccounts: subAccounts.map<TokenAccount>((a: TokenAccount) => {
          const subAccount = {
            ...a,
            swapHistory: [...a.swapHistory, swapOperation],
          };
          return a.id === fromAccount?.id ? subAccount : a;
        }),
      }
    : { ...account, swapHistory: [...account.swapHistory, swapOperation] };
};
