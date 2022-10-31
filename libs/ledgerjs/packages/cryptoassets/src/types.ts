import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

export type ERC20Token = [
  CryptoCurrencyId,
  string,
  string,
  number,
  string,
  string,
  string,
  boolean,
  boolean,
  string,
  string
];
