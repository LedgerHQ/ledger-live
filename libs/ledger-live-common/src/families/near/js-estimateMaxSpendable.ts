import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, NearAccount } from "./types";
import { getMainAccount } from "../../account";
import { getMaxAmount } from "./logic";
import { createTransaction } from "./js-transaction";
import getEstimatedFees from "./js-getFeesForTransaction";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
  calculatedFees,
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  calculatedFees?: BigNumber;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount) as NearAccount;
  const t = {
    ...createTransaction(),
    ...transaction,
    amount: a.spendableBalance,
  };

  const fees = calculatedFees ?? (await getEstimatedFees(t));

  const maxSpendable = getMaxAmount(a, t, fees);

  if (maxSpendable.lt(0)) {
    return new BigNumber(0);
  }

  return maxSpendable;
};

export default estimateMaxSpendable;
