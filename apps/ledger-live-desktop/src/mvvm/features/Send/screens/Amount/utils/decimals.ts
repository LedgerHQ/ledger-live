export function clampDecimals(display: string): string {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return display;

  const integerPart = display.slice(0, sepIndex);
  const sep = display[sepIndex];
  const decimals = display.slice(sepIndex + 1);
  if (decimals.length <= 2) return display;
  return `${integerPart}${sep}${decimals.slice(0, 2)}`;
}

export function isOverDecimalLimit(display: string): boolean {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return false;
  return display.length - sepIndex - 1 > 2;
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
