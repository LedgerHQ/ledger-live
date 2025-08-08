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
      useAllAmount: true,
      fees: transaction?.fees ? BigInt(transaction.fees.toString()) : 0n,
    };
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(mainAccount, draftTransaction),
    );
    const { amount } = await getAlpacaApi(network, kind).validateIntent(
      transactionToIntent(account, { ...draftTransaction }),
    );
    if (network === "stellar") {
      return amount > 0 ? new BigNumber(amount.toString()) : new BigNumber(0);
    }

    const bnFee = BigNumber(fees.value.toString());
    return BigNumber.max(0, account.spendableBalance.minus(bnFee));
  };
}
