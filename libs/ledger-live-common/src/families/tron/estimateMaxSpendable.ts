import { AccountBridge } from "@ledgerhq/types-live";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { createTransaction } from "./createTransaction";
import { getMainAccount } from "../../account";
import { getEstimatedFees } from "./logic";
import { fetchTronContract } from "./api";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const isContract = transaction?.recipient
    ? !!(await fetchTronContract(transaction.recipient))
    : false;
  const fees = await getEstimatedFees(
    mainAccount,
    {
      ...createTransaction(account),
      subAccountId: account.type === "TokenAccount" ? account.id : null,
      ...transaction,
      recipient: transaction?.recipient || getAbandonSeedAddress("tron"),
      amount: new BigNumber(0),
    },
    isContract,
  );

  return account.type === "Account"
    ? BigNumber.max(0, account.spendableBalance.minus(fees))
    : account.balance;
};
