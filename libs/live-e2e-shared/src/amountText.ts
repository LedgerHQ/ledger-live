export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * Returns the amount printed before `ticker` as text, without thousands separators.
 * Text, not a number: 18-decimal values do not fit a double.
 */
export function extractAmountText(text: string, ticker: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = new RegExp(String.raw`([\d.,]+)\s*${escapeRegExp(ticker)}`).exec(normalized);
  if (!match) throw new Error(`No ${ticker} amount in "${text}"`);
  return match[1].replaceAll(",", "");
}
