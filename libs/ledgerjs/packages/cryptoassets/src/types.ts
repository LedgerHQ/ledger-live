import { cryptocurrenciesById } from "./currencies";

// FIXME This should be the other way around, CryptoCurrencyIds should be defined on its own and cryptocurrenciesById should be derived from it.
// That way CryptoCurrencyIds could be moved to the types-cryptoassets lib where it belongs.
export type CryptoCurrencyIds = keyof typeof cryptocurrenciesById;
