import { cryptocurrenciesById } from "./currencies";

// FIXME This should be the other way around, CryptoCurrencyIds should be defined on its own and cryptocurrenciesById should be derived from it.
// That way CryptoCurrencyIds could be moved to the types-cryptoassets lib where it belongs.
export type CryptoCurrencyIds = keyof typeof cryptocurrenciesById;

export type ERC20Token = [
  string,
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

export type TronToken = [
  string,
  string,
  string,
  string,
  number,
  boolean,
  string,
  boolean
];

export type Bep20Token = [
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  boolean,
  boolean,
  string
];

export type AlgorandASAToken = [
  string,
  string,
  string,
  string,
  number,
  boolean
];

export type ElronESDTToken = [string, string, number, string, string];

export type CardanoNativeToken = [
  string,
  string,
  string,
  string,
  string,
  number,
  boolean,
  boolean
];

export type StellarToken = [string, string, string, string, number, boolean];
