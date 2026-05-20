/**
 * Format a contact name into 1–2 uppercase initials for the avatar.
 *
 * Rules:
 * - 0 tokens after splitting on whitespace → "" (caller renders a fallback)
 * - 1 token → first letter, uppercased
 * - 2+ tokens → first letter of first token + first letter of last token, uppercased
 *
 * Examples:
 *   "me"             → "M"
 *   "Benoit Lucet"   → "BL"
 *   "brian (me)"     → "B(" (current rule — accepts parens as a token)
 *   "  alice  bob  carol  " → "AC"
 *   ""               → ""
 */
export function getContactInitials(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  const first = tokens[0].charAt(0);
  const last = tokens[tokens.length - 1].charAt(0);
  return (first + last).toUpperCase();
}
