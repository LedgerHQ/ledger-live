// @flow
import type { Account, Operation, Transaction } from "../types";
import type { Exchange, ExchangeRate } from "./types";

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
  return {
    ...account,
    swapHistory: [
      ...(account.swapHistory || []),
      {
        status: "new",
        provider: exchangeRate.provider,
        operationId: operation.id,
        swapId,
        receiverAccountId: exchange.toAccount.id,
        fromAmount: transaction.amount,
        toAmount: transaction.amount.times(exchangeRate.magnitudeAwareRate),
      },
    ],
  };
};
