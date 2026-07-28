export function truncateContactAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}
