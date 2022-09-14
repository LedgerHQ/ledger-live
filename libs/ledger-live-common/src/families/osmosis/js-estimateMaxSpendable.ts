import { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import getEstimatedFees from "./js-getFeesForTransaction";
import { CosmosOperationMode } from "../cosmos/types";

/**
 * Returns the maximum possible amount for transaction, considering fees
 *
 * @param {Object} param - account, parentAccount
 */
const estimateMaxSpendable = async ({
  account,
  parentAccount,
  mode,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  mode: CosmosOperationMode;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const fees = await getEstimatedFees(mode);
  return BigNumber.max(0, a.spendableBalance.minus(fees));
};

export default estimateMaxSpendable;
