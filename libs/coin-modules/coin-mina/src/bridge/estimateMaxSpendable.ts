import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMaxAmount } from "../common-logic";
import type { Transaction, MinaAccount } from "../types/common";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getEstimatedFees";

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

  const { fee } = await getEstimatedFees(t, a.freshAddress);

  const maxSpendable = getMaxAmount(a, t, fee);

  if (maxSpendable.lt(0)) {
    return new BigNumber(0);
  }

  return maxSpendable;
};

export default estimateMaxSpendable;
