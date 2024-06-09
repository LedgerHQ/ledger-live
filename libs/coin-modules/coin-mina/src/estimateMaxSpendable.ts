import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, MinaAccount } from "./types";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getMaxAmount } from "./logic";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";

const estimateMaxSpendable: AccountBridge<
  Transaction,
  MinaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount) as MinaAccount;
  const t = {
    ...createTransaction(account),
    ...transaction,
    amount: a.spendableBalance,
  };

  const fees = await getEstimatedFees(t);

  const maxSpendable = getMaxAmount(a, t, fees);

  if (maxSpendable.lt(0)) {
    return new BigNumber(0);
  }

  return maxSpendable;
};

export default estimateMaxSpendable;
