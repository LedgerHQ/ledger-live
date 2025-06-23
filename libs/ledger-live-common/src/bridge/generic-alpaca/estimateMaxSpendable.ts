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

    const draftTransaction = {
      ...createTransaction(account as any),
      ...transaction,
      amount: mainAccount.spendableBalance,
    };
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(mainAccount, draftTransaction),
    );
    console.log("fees", fees);
    console.log("spendableBalance", account.spendableBalance.toString());
    const bnFee = BigNumber(fees.value.toString());
    console.log("spendableBalance final", account.spendableBalance.toString());
    return BigNumber.max(0, account.spendableBalance.minus(bnFee));
  };
}
