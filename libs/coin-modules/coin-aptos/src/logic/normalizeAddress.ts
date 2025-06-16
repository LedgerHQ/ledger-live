export const normalizeAddress = (address: string): string => {
  const rawAddresss = address.slice(2);
  if (rawAddresss.length === 64) {
    return address;
  }

  return "0x" + rawAddresss.padStart(64, "0");
};
