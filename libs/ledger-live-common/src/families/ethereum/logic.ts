import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";

export const isEthereumAddress = (address: string): boolean =>
  /^0x[0-9a-fA-F]{40}$/.test(address);

export const getDefaultFeeUnit = (currency: CryptoCurrency): Unit =>
  currency.units.length > 1 ? currency.units[1] : currency.units[0];

export default {
  isEthereumAddress,
  getDefaultFeeUnit,
};
