import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, MinaAccount } from "./types";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { createTransaction } from "./js-transaction";
import getEstimatedFees from "./js-getFeesForTransaction";
import { getMaxAmount } from "./logic";

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
  const a = getMainAccount(account, parentAccount) as MinaAccount;
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
