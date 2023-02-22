import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";

export const isEthereumAddress = (address: string): boolean =>
  /^0x[0-9a-fA-F]{40}$/.test(address);

export const getDefaultFeeUnit = (currency: CryptoCurrency): Unit =>
  currency.units.length > 1 ? currency.units[1] : currency.units[0];

export const padHexString = (str: string): string => {
  return str.length % 2 !== 0 ? "0" + str : str;
};

export default {
  isEthereumAddress,
  getDefaultFeeUnit,
  padHexString,
};
