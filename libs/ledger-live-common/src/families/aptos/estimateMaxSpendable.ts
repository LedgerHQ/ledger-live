import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";
import { getMaxSendBalance } from "./logic";
import { AptosAPI } from "./api";
import { getEstimatedGas } from "./getFeesForTransaction";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);

  const aptosClient = new AptosAPI(mainAccount.currency.id);

  const { estimate } = await getEstimatedGas(mainAccount, transaction, aptosClient);

  return getMaxSendBalance(
    mainAccount.spendableBalance,
    BigNumber(estimate.maxGasAmount),
    BigNumber(estimate.gasUnitPrice),
  );
};

export default estimateMaxSpendable;
