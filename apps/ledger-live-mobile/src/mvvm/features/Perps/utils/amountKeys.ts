import BigNumber from "bignumber.js";
import { KEYPAD_DELETE_KEY } from "LLM/components/AmountKeypad";

const AMOUNT_DELETE_KEY = KEYPAD_DELETE_KEY;

/** Mirrors AmountInput's own maxIntegerLength default, past which it truncates the display. */
const AMOUNT_MAX_INTEGER_DIGITS = 9;

/**
 * Returns the amount text after pressing `key` on the in-app keypad.
 */
export function applyAmountKey(currentText: string, key: string, maxDecimalDigits: number): string {
  if (key === AMOUNT_DELETE_KEY) return currentText.slice(0, -1);

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
  const [integerPart = "", decimalPart = ""] = BigNumber(amount)
    .decimalPlaces(maxDecimalDigits, BigNumber.ROUND_DOWN)
    .toFixed()
    .split(".");
  const truncated = integerPart.slice(0, AMOUNT_MAX_INTEGER_DIGITS);
  return decimalPart ? `${truncated}.${decimalPart}` : truncated;
}

function isWithinPrecision(text: string, maxDecimalDigits: number): boolean {
  const [integerPart = "", decimalPart = ""] = text.split(".");
  return integerPart.length <= AMOUNT_MAX_INTEGER_DIGITS && decimalPart.length <= maxDecimalDigits;
}
