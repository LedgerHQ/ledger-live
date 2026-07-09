import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "@ledgerhq/coin-bitcoin/types";
import { getAdditionalFeeRequiredForRbf } from "./rbfValidation";

export const hasMinimumFundsToCancel = async ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: BtcTransaction;
}): Promise<boolean> => {
  try {
    const additionalFeeRequired = await getAdditionalFeeRequiredForRbf({
      mainAccount,
      transactionToUpdate,
    });

    return mainAccount.spendableBalance.gte(additionalFeeRequired);
  } catch {
    return false;
  }
};

export const hasMinimumFundsToSpeedUp = ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: BtcTransaction;
}): Promise<boolean> => {
  return hasMinimumFundsToCancel({ mainAccount, transactionToUpdate });
};
