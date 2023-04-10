import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export const DEFAULT_GAS = 500;
export const DEFAULT_GAS_PRICE = 100;
export const ESTIMATE_GAS_MUL = 1.2;

const HEX_REGEXP = /^[-+]?[a-f0-9]+\.?[a-f0-9]*?$/i;

const LENGTH_WITH_0x = 66;

export function isValidAddress(address = ""): boolean {
  let str = address;

  const validAddressWithOx =
    address.startsWith("0x") && address.length === LENGTH_WITH_0x;

  if (!validAddressWithOx) return false;

  str = str.substring(2);

  return isValidHex(str);
}

function isValidHex(hex: string): boolean {
  return HEX_REGEXP.test(hex);
}

export function isTestnet(currencyId: string): boolean {
  return getCryptoCurrencyById(currencyId).isTestnetFor ? true : false;
}
