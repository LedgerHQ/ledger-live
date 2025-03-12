/**
 * Returns true if account is the signer
 */
export function ensureAddressFormat(addr: string): `0x${string}` {
  return (addr.startsWith("0x") ? addr : `0x${addr}`) as `0x${string}`;
}
