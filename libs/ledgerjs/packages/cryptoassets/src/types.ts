import { cryptocurrenciesById } from "./currencies";
export type { AlgorandASAToken } from "./data/asa";
export type { BEP20Token } from "./data/bep20";
export type { CardanoNativeToken } from "./data/cardanoNative";
export type { ERC20Token } from "./data/erc20";
export type { ElrondESDTToken } from "./data/esdt";
export type { PolygonERC20Token } from "./data/polygon-erc20";
export type { StellarToken } from "./data/stellar";
export type { TRC10Token } from "./data/trc10";
export type { TRC20Token } from "./data/trc20";

// FIXME This should be the other way around, CryptoCurrencyIds should be defined on its own and cryptocurrenciesById should be derived from it.
// That way CryptoCurrencyIds could be moved to the types-cryptoassets lib where it belongs.
export type CryptoCurrencyIds = keyof typeof cryptocurrenciesById;
