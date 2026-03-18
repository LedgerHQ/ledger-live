import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "../types";
import { getAdditionalFeeRequiredForRbf } from "../rbfHelpers";

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
