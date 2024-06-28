import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import type { Transaction } from "./types";

const notCreatedStellarMockAddress = "GAW46JE3SHIAYLNNNQCAZFQ437WB5ZH7LDRDWR5LVDWHCTHCKYB6RCCH";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const preparedTransaction = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || notCreatedStellarMockAddress,
    // not used address
    useAllAmount: true,
  });

  const status = await getTransactionStatus(mainAccount, preparedTransaction);
  return status.amount.gte(0) ? status.amount : new BigNumber(0);
};

export default estimateMaxSpendable;
