import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { Account, Operation } from "@ledgerhq/types-live";
import { postSwapAccepted, postSwapCancelled } from "./index";
import addToSwapHistory from "./addToSwapHistory";
import { Exchange, ExchangeRate } from "./types";
import { addPendingOperation } from "../../account/index";
import { getMainAccount } from "../../account/helpers";
import { Transaction } from "../../generated/types";

export const getUpdateAccountActionParamsAfterSwap = ({
  result,
  exchange,
  transaction,
  magnitudeAwareRate,
  provider,
}: {
  result: { operation: Operation; swapId: string };
  exchange: Exchange;
  transaction?: Transaction | null;
  magnitudeAwareRate: BigNumber;
  provider: string;
}) => {
  const { operation, swapId } = result;

  /**
   * If transaction broadcast are disabled, consider the swap as cancelled
   * since the partner will never receive the funds
   */
  if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
    postSwapCancelled({
      provider,
      swapId,
    });
  } else {
    postSwapAccepted({
      provider,
      swapId,
      transactionId: operation.hash,
    });
  }

  const mainAccount =
    exchange.fromAccount && getMainAccount(exchange.fromAccount, exchange.fromParentAccount);
  if (!mainAccount) return;
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
