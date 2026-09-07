/**
 * Matches an amount as an exact digit sequence, so a differently-rounded value cannot satisfy
 * the assertion: "0.1234567890" contains "0.123456789", which a plain substring check accepts.
 *
 * Shared by the desktop and mobile amount assertions — keep one copy so they cannot drift.
 */
export function exactAmountPattern(amount: string): RegExp {
  const escaped = amount.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(String.raw`(?<!\d)${escaped}(?!\d)`);
}
