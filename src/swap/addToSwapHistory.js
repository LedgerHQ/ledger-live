// @flow
import type { Account, Operation, Transaction } from "../types";
import type { Exchange, ExchangeRate } from "./types";
import { getAccountCurrency, getMainAccount } from "../account";

export default (
  account: Account,
  operation: Operation,
  transaction: Transaction,
  swap: {
    exchange: $Shape<Exchange>,
    exchangeRate: ExchangeRate,
  },
  swapId: string
) => {
  const { exchange, exchangeRate } = swap;
  const toCurrency = getAccountCurrency(exchange.toAccount);
  const tokenId =
    toCurrency.type === "TokenCurrency" ? toCurrency.id : undefined;

  return {
    ...account,
    swapHistory: [
      ...(account.swapHistory || []),
      {
        status: "new",
        provider: exchangeRate.provider,
        operationId: operation.id,
        swapId,
        receiverAccountId: getMainAccount(
          exchange.toAccount,
          exchange.toParentAccount
        ).id,
        tokenId,
        fromAmount: transaction.amount,
        toAmount: transaction.amount.times(exchangeRate.magnitudeAwareRate),
      },
    ],
  };
};
