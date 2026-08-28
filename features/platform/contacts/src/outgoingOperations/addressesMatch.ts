/**
 * EVM addresses (`0x` on both sides) compare case-insensitively; everything else exactly. Mirrors
 * the Send recipient rule in `libs/ledger-live-common` without importing from `libs/`.
 */
export function addressesMatch(left: string, right: string): boolean {
  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();

  return normalizedLeft.startsWith("0x") && normalizedRight.startsWith("0x")
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}
