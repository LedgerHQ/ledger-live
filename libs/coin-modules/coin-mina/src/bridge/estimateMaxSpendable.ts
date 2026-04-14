import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMaxAmount } from "../logic/utils";
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

  return getMaxAmount(a, t, fee);
};

export default estimateMaxSpendable;
