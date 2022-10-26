export const isEthereumAddress = (address: string): boolean =>
  Boolean(address.match(/^0x[0-9a-fA-F]{40}$/));
