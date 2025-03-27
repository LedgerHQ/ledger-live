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
    const mainAccount = getMainAccount(account, parentAccount);

    const draftTransaction = {
      ...createTransaction(account as any),
      ...transaction,
      amount: mainAccount.spendableBalance,
    };
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(mainAccount, draftTransaction),
    );

    const bnFee = BigNumber(fees.toString());

    return account.spendableBalance.minus(bnFee);
  };
}
