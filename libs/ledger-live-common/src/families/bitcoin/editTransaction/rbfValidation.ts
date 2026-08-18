import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "@ledgerhq/coin-bitcoin/types";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/getWalletAccount";
import { getOriginalTxFeeContext } from "@ledgerhq/coin-bitcoin/rbfFees";

const ZERO = new BigNumber(0);

/**
 * Original transaction fee rate (sat/vB). Used when validating RBF replacement
 * and transactionToUpdate.feePerByte is not available (e.g. not stored in operation).
 */
export const getOriginalTxFeeRateSatVb = async (
  account: Account,
  originalTxId: string,
): Promise<BigNumber | null> => {
  try {
    const walletAccount = getWalletAccount(account);
    const ctx = await getOriginalTxFeeContext(walletAccount, originalTxId);
    return ctx ? ctx.oldFeeRateSatVb : null;
  } catch {
    return null;
  }
};

/**
 * Extra fee (in sats) required by common Bitcoin Core RBF policy:
 * - absolute fee increase >= incrementalRelayFee * vsize
 * - feerate increase >= incrementalRelayFee
 *
 * Uses original tx vsize as a proxy for replacement tx vsize.
 */
export const getAdditionalFeeRequiredForRbf = async ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: BtcTransaction;
}): Promise<BigNumber> => {
  if (!transactionToUpdate.replaceTxId) return ZERO;

  const walletAccount = getWalletAccount(mainAccount);
  const ctx = await getOriginalTxFeeContext(walletAccount, transactionToUpdate.replaceTxId);
  if (!ctx) return ZERO;

  const { vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb } = ctx;

  const minNewFeeFromAbsolute = oldFeeSat.plus(
    incrementalFeeRateSatVb.times(vsize).integerValue(BigNumber.ROUND_CEIL),
  );

  const minNewFeeFromRate = oldFeeRateSatVb
    .plus(incrementalFeeRateSatVb)
    .times(vsize)
    .integerValue(BigNumber.ROUND_CEIL);

  const minNewFeeSat = BigNumber.maximum(minNewFeeFromAbsolute, minNewFeeFromRate);
  return BigNumber.maximum(minNewFeeSat.minus(oldFeeSat), ZERO);
};
