import { AccountBridge } from "@ledgerhq/types-live";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";
import createTransaction from "./createTransaction";
import { getMainAccount } from "../../account";
import { Transaction } from "./types";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const tx = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    recipient: transaction?.recipient || "0x0000000000000000000000000000000000000000",
    useAllAmount: true,
  });
  const { amount } = await getTransactionStatus(mainAccount, tx);

  return amount;
};

export default estimateMaxSpendable;
