/**
 * Ensures that the address is in the format `0x...`
 * @param addr The address to ensure the format of
 * @returns The address in the format `0x...`
 */
export function ensureAddressFormat(addr: string): `0x${string}` {
  return (addr?.startsWith("0x") ? addr : `0x${addr}`) as `0x${string}`;
}
