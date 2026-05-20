/**
 * Format a contact name into 1–2 uppercase initials for the avatar.
 *
 * Splits the trimmed name on whitespace, drops tokens that don't start with
 * an ASCII letter (so the "(Me)" suffix in `"Brian (Me)"` is ignored), and:
 * - 0 letter tokens → `""` (caller renders a fallback)
 * - 1 letter token  → first letter, uppercased
 * - 2+ letter tokens → first letter of first + last token, uppercased
 *
 * Examples (matches the Figma list in node 13802:2833):
 *   "Brian (Me)"     → "B"
 *   "Anna Kulikova"  → "AK"
 *   "Baptiste Bouvet"→ "BB"
 *   "Benoit Lucet"   → "BL"
 *   "Guillaume Mathias" → "GM"
 *   "John Smith"     → "JS"
 *   "me"             → "M"
 *   ""               → ""
 */
const LETTER_HEAD = /^[A-Za-z]/;

export function getContactInitials(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(t => LETTER_HEAD.test(t));
  if (tokens.length === 0) return "";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  const first = tokens[0].charAt(0);
  const last = tokens[tokens.length - 1].charAt(0);
  return (first + last).toUpperCase();
}
