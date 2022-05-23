import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "../../types";
import { getMainAccount } from "../../account";
import getEstimatedFees from "./js-getFeesForTransaction";

/**
 * Returns the maximum possible amount for transaction, considering fees
 *
 * @param {Object} param - account, parentAccount
 */
const estimateMaxSpendable = async ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const fees = await getEstimatedFees();
  return BigNumber.max(0, a.spendableBalance.minus(fees));
};

export default estimateMaxSpendable;
