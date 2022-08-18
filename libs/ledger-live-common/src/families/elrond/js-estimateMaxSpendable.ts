import { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import type { Transaction } from "./types";
import { createTransaction } from "./js-transaction";
import getEstimatedFees from "./js-getFeesForTransaction";
import { GAS } from "./constants";
import { ElrondEncodeTransaction } from "./encode";
import { Account, AccountLike } from "@ledgerhq/types-live";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
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
  const tx = {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
  };

  const tokenAccount =
    tx.subAccountId &&
    mainAccount.subAccounts &&
    mainAccount.subAccounts.find((ta) => ta.id === tx.subAccountId);

  if (tokenAccount) {
    return tokenAccount.balance;
  }

  switch (tx?.mode) {
    case "reDelegateRewards":
      tx.gasLimit = GAS.DELEGATE;

      tx.data = ElrondEncodeTransaction.reDelegateRewards();
      break;
    case "withdraw":
      tx.gasLimit = GAS.DELEGATE;

      tx.data = ElrondEncodeTransaction.withdraw();
      break;
    case "unDelegate":
      tx.gasLimit = GAS.DELEGATE;

      tx.data = ElrondEncodeTransaction.unDelegate(tx);
      break;
    case "delegate":
      tx.gasLimit = GAS.DELEGATE;

      tx.data = ElrondEncodeTransaction.delegate();
      break;

    case "claimRewards":
      tx.gasLimit = GAS.CLAIM;

      tx.data = ElrondEncodeTransaction.claimRewards();
      break;

    default:
      break;
  }

  const fees = await getEstimatedFees(tx);

  if (fees.gt(mainAccount.spendableBalance)) {
    return new BigNumber(0);
  }

  return mainAccount.spendableBalance.minus(fees);
};

export default estimateMaxSpendable;
