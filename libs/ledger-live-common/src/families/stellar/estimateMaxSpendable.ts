import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";

const notCreatedStellarMockAddress = "GAW46JE3SHIAYLNNNQCAZFQ437WB5ZH7LDRDWR5LVDWHCTHCKYB6RCCH";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || notCreatedStellarMockAddress,
    // not used address
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount.gte(0) ? s.amount : new BigNumber(0);
};

export default estimateMaxSpendable;
