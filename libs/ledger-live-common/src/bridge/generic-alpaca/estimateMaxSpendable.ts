import { getMainAccount } from "../../account";
import { getAlpacaApi } from "./alpaca";
import { createTransaction } from "./createTransaction";
import { transactionToIntent } from "./utils";

export async function genericEstimateMaxSpendable(network, kind) {
  return async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount);

    const draftTransaction = {
      ...createTransaction(account),
      ...transaction,
      amount: mainAccount.spendableBalance,
    };
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(mainAccount, draftTransaction),
    );

    return account.spendableBalance.minus(fees);
  };
}
