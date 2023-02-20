import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { AlgorandTransaction, AlgorandAccount } from "./types";
import { computeAlgoMaxSpendable } from "./logic";
import { createTransaction } from "./js-prepareTransaction";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { getEstimatedFees } from "./js-getFeesForTransaction";

export const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: AlgorandTransaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { algorandResources } = mainAccount as AlgorandAccount;
  if (!algorandResources) {
    throw new Error("Algorand account expected");
  }

  const tx = {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    recipient:
      transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  };

  const tokenAccount =
    tx.subAccountId &&
    mainAccount.subAccounts &&
    mainAccount.subAccounts.find((ta) => ta.id === tx.subAccountId);

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
