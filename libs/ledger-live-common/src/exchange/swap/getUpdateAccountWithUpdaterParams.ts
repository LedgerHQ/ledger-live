import { BigNumber } from "bignumber.js";
import { Account, Operation } from "@ledgerhq/types-live";
import addToSwapHistory from "./addToSwapHistory";
import { ExchangeSwap, ExchangeRate } from "./types";
import { addPendingOperation, getMainAccount } from "../../account/index";
import { Transaction } from "../../generated/types";

export const getUpdateAccountWithUpdaterParams = ({
  result,
  exchange,
  transaction,
  magnitudeAwareRate,
  provider,
}: {
  result: { operation: Operation; swapId: string };
  exchange: ExchangeSwap;
  transaction?: Transaction | null;
  magnitudeAwareRate: BigNumber;
  provider: string;
}): [string, (account: Account) => Account] | [] => {
  const { operation, swapId } = result;
  const mainAccount =
    exchange.fromAccount && getMainAccount(exchange.fromAccount, exchange.fromParentAccount);
  if (!mainAccount) return [];
  const accountUpdater = (account: Account) => {
    if (!transaction) return account;
    const accountWithUpdatedHistory = addToSwapHistory({
      account,
      operation,
      transaction,
      swap: {
        exchange,
        exchangeRate: {
          magnitudeAwareRate,
          provider,
        } as ExchangeRate,
      },
      swapId,
    });
    return addPendingOperation(accountWithUpdatedHistory, operation);
  };
  return [mainAccount.id, accountUpdater];
};
