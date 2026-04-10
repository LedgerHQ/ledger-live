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
    // Normalize addresses by removing 0x prefix and converting to lowercase
    const normalizeAddress = (addr: string) => addr.toLowerCase().replace(/^0x/, "");
    return normalizeAddress(tokenContractAddress) === normalizeAddress(feeCurrency);
  }

  return false;
};

type EighteenDecimalBigNumber = BigNumber;

export const normalizeAndSubtract = (
  balance: BigNumber,
  fee: EighteenDecimalBigNumber | null | undefined,
  decimals: number,
): BigNumber => {
  const feeValue = fee || BigNumber(0);
  const balanceInWei = balance.multipliedBy(new BigNumber(10).pow(18 - decimals));

  return balanceInWei.minus(feeValue);
};

/**
 * Adjusts the decimals of a given number from 18 decimals to a specified number of target decimals.
 *
 * Native CELO uses 18 decimals by default. This function is designed to scale the value
 * to the corresponding number in the target decimal system. If the `targetDecimals` is
 * already 18, the input number remains unchanged.
 *
 * @param {BigNumber} number - The numerical value to convert, represented as a BigNumber.
 * @param {number} targetDecimals - The desired number of decimals to convert the value to.
 * @returns {BigNumber} A new BigNumber instance adjusted to the specified target decimals.
 */
export const convertNumberDecimals = (number: BigNumber, targetDecimals: number): BigNumber => {
  // Native CELO has 18 decimals, so no conversion needed
  if (targetDecimals === 18) {
    return number;
  }

  // Convert from 18 decimals to target decimals
  // e.g., for 6 decimals: divide by 10^(18-6) = 10^12
  const decimalDifference = 18 - targetDecimals;
  return number.dividedToIntegerBy(new BigNumber(10).pow(decimalDifference));
};
