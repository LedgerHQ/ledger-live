export const isEthereumAddress = (address: string): boolean =>
  /^0x[0-9a-fA-F]{40}$/.test(address);
