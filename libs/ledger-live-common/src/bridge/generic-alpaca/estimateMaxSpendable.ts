import { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import { getAlpacaApi } from "./alpaca";
import { createTransaction } from "./createTransaction";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";

export function genericEstimateMaxSpendable(
  network,
  kind,
): AccountBridge<any>["estimateMaxSpendable"] {
  return async ({ account, parentAccount, transaction }) => {
    if (account.type === "TokenAccount") {
      return account.spendableBalance;
    }
    const mainAccount = getMainAccount(account, parentAccount);
    const alpacaApi = getAlpacaApi(mainAccount.currency.id, kind);
    const draftTransaction = {
      ...createTransaction(account),
      ...transaction,
      amount: mainAccount.spendableBalance,
      useAllAmount: true,
    };

    let fees = transaction?.fees;
    if (transaction?.fees === null || transaction?.fees === undefined) {
      fees = (
        await alpacaApi.estimateFees(
          transactionToIntent(mainAccount, draftTransaction, alpacaApi.computeIntentType),
        )
      ).value;
    }
    // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22229
    const { amount } = await alpacaApi.validateIntent(
      transactionToIntent(account, { ...draftTransaction }, alpacaApi.computeIntentType),
      { value: transaction?.fees ? BigInt(transaction.fees.toString()) : 0n },
    );
    if (["stellar", "tezos", "evm"].includes(network)) {
      return amount > 0 ? new BigNumber(amount.toString()) : new BigNumber(0);
    }
    const bnFee = BigNumber(fees.toString());
    return BigNumber.max(0, account.spendableBalance.minus(bnFee));
  };
}
