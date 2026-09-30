import { BigNumber } from "bignumber.js";

import type { Account } from "@ledgerhq/types-live";
import { DEFAULT_RBF_MIN_BUMP_RATIO } from "@ledgerhq/coin-bitcoin/constants";
import { getBitcoinCoinConfig } from "../coinConfig";

/**
 * Returns the minimum fee rate to replace (RBF) a bitcoin transaction.
 * Rule of thumb: at least +`fees.rbfMinBumpRatio` (10 % by default) and at least +1 sat/vB.
 */
export const getMinFees = ({
  mainAccount,
  feePerByte,
}: {
  mainAccount: Account;
  feePerByte: BigNumber;
}): { feePerByte: BigNumber } => {
  const minBumpRatio =
    getBitcoinCoinConfig(mainAccount.currency.id).fees?.rbfMinBumpRatio ??
    DEFAULT_RBF_MIN_BUMP_RATIO;
  const factorBump = feePerByte.times(1 + minBumpRatio);
  const oneSatBump = feePerByte.plus(1);

  const bumped = BigNumber.maximum(factorBump, oneSatBump).integerValue(BigNumber.ROUND_CEIL);

  return { feePerByte: bumped };
};
