import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { findSubAccountById, getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AlgorandAccount, AlgorandTransaction } from "./types";
import { getEstimatedFees } from "./getFeesForTransaction";
import createTransaction from "./createTransaction";
import { computeAlgoMaxSpendable } from "./logic";

export const estimateMaxSpendable: AccountBridge<
  AlgorandTransaction,
  AlgorandAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { algorandResources } = mainAccount;
  if (!algorandResources) {
    throw new Error("Algorand account expected");
  }

  const tx = {
    ...createTransaction(account),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    recipient: transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  };

  const tokenAccount = tx.subAccountId
    ? findSubAccountById(mainAccount, tx.subAccountId)
    : undefined;

  if (tokenAccount) {
    return tokenAccount.balance;
  } else {
    const fees = await getEstimatedFees(mainAccount, tx);

    let maxSpendable = computeAlgoMaxSpendable({
      accountBalance: mainAccount.balance,
      nbAccountAssets: algorandResources.nbAssets,
      mode: tx.mode,
    });

    maxSpendable = maxSpendable.minus(fees);

    return maxSpendable.gte(0) ? maxSpendable : new BigNumber(0);
  }
};
