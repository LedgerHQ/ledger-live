/**
 * Wider address truncation tuned for the Contacts management details
 * pane. The shared `truncateAddress` util keeps a 6+4 envelope (good
 * for inline previews); this one keeps 6+8 because the details column
 * is wider and the Figma frame 13802:2833 shows a longer tail.
 */
export function truncateAddressLong(addressHex: string): string {
  if (addressHex.length <= 16) return addressHex;
  return `${addressHex.slice(0, 6)}…${addressHex.slice(-8)}`;
}
