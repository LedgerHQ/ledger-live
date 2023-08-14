import { getMainAccount } from "../../account";
import createTransaction from "./js-createTransaction";
import prepareTransaction from "./js-prepareTransaction";
import getTransactionStatus from "./js-getTransactionStatus";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";

const notCreatedStellarMockAddress = "GAW46JE3SHIAYLNNNQCAZFQ437WB5ZH7LDRDWR5LVDWHCTHCKYB6RCCH";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient: transaction?.recipient || notCreatedStellarMockAddress,
    // not used address
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount.gte(0) ? s.amount : new BigNumber(0);
};

export default estimateMaxSpendable;
