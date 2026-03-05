import { BigNumber } from "bignumber.js";

/** Format value as hex with 0x prefix for JSON-RPC (Go hexutil.Big requires 0x). Returns 0x0 for NaN, negative, or zero. */
export const valueToHex = (value: BigNumber): string => {
  if (value.isNaN() || value.isNegative() || value.isZero()) return "0x0";
  return "0x" + value.toString(16);
};

/**
 * Determines if the fee currency matches the token being sent.
 * Returns true when fees should be deducted from the sendable amount.
 *
 * @param isTokenTransaction - Whether this is a token transfer (not native CELO)
 * @param tokenContractAddress - Contract address of the token being sent (if token transaction)
 * @param feeCurrency - Contract address of the token used to pay fees (null/undefined = native CELO)
 * @returns true if fee token matches send token, false otherwise
 */
export const isSameTokenAsFee = (
  isTokenTransaction: boolean,
  tokenContractAddress: string | undefined,
  feeCurrency: `0x${string}` | null | undefined,
): boolean => {
  // Native CELO transfer with native CELO fee
  if (!isTokenTransaction && !feeCurrency) {
    return true;
  }

  // Token transfer with native CELO fee - different tokens
  if (isTokenTransaction && !feeCurrency) {
    return false;
  }

  // Native CELO transfer with token fee - different tokens
  if (!isTokenTransaction && feeCurrency) {
    return false;
  }

  // Token transfer with token fee - compare addresses (case-insensitive)
  if (isTokenTransaction && feeCurrency && tokenContractAddress) {
    return tokenContractAddress.toLowerCase() === feeCurrency.toLowerCase();
  }

  return false;
};

type SixDecimalBigNumber = BigNumber;
type EighteenDecimalBigNumber = BigNumber;

export const normalizeAndSubtract = (
  balance: SixDecimalBigNumber,
  fee?: EighteenDecimalBigNumber | null,
): BigNumber => {
  const feeValue = fee || BigNumber(0);
  const balanceInWei = balance.multipliedBy(1e12);

  return balanceInWei.minus(feeValue);
};
