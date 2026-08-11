import BigNumber from "bignumber.js";

export const AMOUNT_MAX_INTEGER_DIGITS = 8;

export const AMOUNT_DELETE_KEY = "delete";

/**
 * Returns the amount text after pressing `key` on the in-app keypad.
 */
export function applyAmountKey(currentText: string, key: string, maxDecimalDigits: number): string {
  if (key === AMOUNT_DELETE_KEY) return currentText.slice(0, -1);

  // A leading separator becomes "0." so the user can keep typing decimals.
  if (key === ".") {
    if (maxDecimalDigits === 0 || currentText.includes(".")) return currentText;
    return `${currentText || "0"}.`;
  }

  const nextText = currentText === "0" ? key : `${currentText}${key}`;
  return isWithinPrecision(nextText, maxDecimalDigits) ? nextText : currentText;
}

/** Serializes a computed amount (ratio, max) as keypad-compatible text. */
export function toAmountText(amount: number, maxDecimalDigits: number): string {
  if (amount === 0) return "";
  return BigNumber(amount).decimalPlaces(maxDecimalDigits, BigNumber.ROUND_DOWN).toFixed();
}

function isWithinPrecision(text: string, maxDecimalDigits: number): boolean {
  const [integerPart = "", decimalPart = ""] = text.split(".");
  return integerPart.length <= AMOUNT_MAX_INTEGER_DIGITS && decimalPart.length <= maxDecimalDigits;
}
