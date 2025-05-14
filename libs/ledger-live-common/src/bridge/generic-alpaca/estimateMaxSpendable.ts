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
    console.log("genericEstimateMaxSpendable parentAccount", parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    console.log("Main Account", mainAccount.spendableBalance.toString());
    console.log("Transaction", transaction);
    const draftTransaction = {
      ...createTransaction(account as any),
      ...transaction,
      amount: mainAccount.spendableBalance,
      useAllAmount: true,
    };
    console.log("Draft Transaction", draftTransaction);
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(mainAccount, draftTransaction),
    );
    const { freshAddress, balance, currency, pendingOperations, spendableBalance, subAccounts } =
      account;
    // FIXME: hardcoding type here
    // debugger
    const { amount } = await getAlpacaApi(network, kind).validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
        pendingOperations: pendingOperations.length,
        spendableBalance: BigInt(spendableBalance.toString()),
        subAccount: subAccounts
          ? subAccounts.find(t => t.id === transaction.subAccountId)
          : undefined,
      },
      {
        type: "PAYMENT",
        recipient: draftTransaction.recipient,
        amount: BigInt(draftTransaction.amount?.toString() ?? "0"),
        fee: BigInt(draftTransaction["fees"]?.toString() ?? "0"),
        useAllAmount: !!draftTransaction.useAllAmount,
        subAccountId: transaction.subAccountId || "",
      },
    );
    console.log("amount", amount.toString());
    if (network === "stellar") {
      return amount > 0 ? new BigNumber(amount.toString()) : new BigNumber(0);
    }
    console.log("fees", fees);
    console.log("spendableBalance", account.spendableBalance.toString());
    const bnFee = BigNumber(fees.value.toString());
    console.log("spendableBalance final", account.spendableBalance.toString());
    return BigNumber.max(0, account.spendableBalance.minus(bnFee));
  };
}
