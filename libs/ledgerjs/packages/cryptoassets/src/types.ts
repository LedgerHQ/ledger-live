export type { CardanoNativeToken } from "./data/cardanoNative";
export type { AlgorandASAToken } from "./data/asa";
export type { ElrondESDTToken } from "./data/esdt";
export type { StellarToken } from "./data/stellar";
export type { CasperToken } from "./data/casper";
export type { TRC10Token } from "./data/trc10";
export type { TRC20Token } from "./data/trc20";

export type ERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  false, // [deprecated] disabled counter values
  boolean, // delisted
];
