import { getMainAccount } from "@ledgerhq/coin-framework/account";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction, TronAccount } from "../types";
import createTransaction from "./createTransaction";
import getEstimatedFees from "./getEstimateFees";

const estimateMaxSpendable: AccountBridge<
  Transaction,
  TronAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const fees = await getEstimatedFees(
    mainAccount,
    {
      ...createTransaction(),
      subAccountId: account.type === "Account" ? null : account.id,
      ...transaction,
      recipient: transaction?.recipient || "0x0000000000000000000000000000000000000000",
      amount: new BigNumber(0),
    },
    account.type === "TokenAccount" ? account : undefined,
  );
  return account.type === "Account"
    ? BigNumber.max(0, account.spendableBalance.minus(fees))
    : account.balance;
};

export default estimateMaxSpendable;
