export const AMOUNT_DELETE_KEY = "delete";

/** Mirrors AmountInput's own maxIntegerLength default, past which it truncates the display. */
const AMOUNT_MAX_INTEGER_DIGITS = 9;

/** Returns the amount text after pressing `key` on the in-app keypad. */
export function applyAmountKey(currentText: string, key: string, maxDecimalDigits: number): string {
  if (key === AMOUNT_DELETE_KEY) return currentText.slice(0, -1);

  if (key === ".") {
    if (maxDecimalDigits === 0 || currentText.includes(".")) return currentText;
    return `${currentText || "0"}.`;
  }

  const nextText = currentText === "0" ? key : `${currentText}${key}`;
  const [integerPart = "", decimalPart = ""] = nextText.split(".");
  const fits =
    integerPart.length <= AMOUNT_MAX_INTEGER_DIGITS && decimalPart.length <= maxDecimalDigits;
  return fits ? nextText : currentText;
}
