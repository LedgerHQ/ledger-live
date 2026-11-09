export function addressesMatch(left: string, right: string): boolean {
  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();

  return normalizedLeft.startsWith("0x") && normalizedRight.startsWith("0x")
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}
