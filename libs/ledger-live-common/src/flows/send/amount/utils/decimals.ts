export function clampDecimals(display: string, maxDecimalLength = 2): string {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return display;

  const integerPart = display.slice(0, sepIndex);
  const sep = display[sepIndex];
  const decimals = display.slice(sepIndex + 1);
  if (maxDecimalLength <= 0) return integerPart;
  if (decimals.length <= maxDecimalLength) return display;
  return `${integerPart}${sep}${decimals.slice(0, maxDecimalLength)}`;
}

export function isOverDecimalLimit(display: string, maxDecimalLength = 2): boolean {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return false;
  return display.length - sepIndex - 1 > maxDecimalLength;
}

export function trimTrailingZeros(display: string): string {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return display;

  const integerPart = display.slice(0, sepIndex);
  const sep = display[sepIndex];
  let decimals = display.slice(sepIndex + 1);

  // Remove trailing zeros
  let endIndex = decimals.length;
  while (endIndex > 0 && decimals[endIndex - 1] === "0") {
    endIndex--;
  }
  decimals = decimals.slice(0, endIndex);

  if (!decimals) return integerPart;
  return `${integerPart}${sep}${decimals}`;
}
