const TRUNCATED_ADDRESS_VISIBLE_LENGTH = 8 + 3 + 8;

export function truncateContactAddress(address: string): string {
  if (address.length <= TRUNCATED_ADDRESS_VISIBLE_LENGTH) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}
