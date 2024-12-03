export const formatAddress = (address: string) => {
  if (address.length > 11) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return address;
};
