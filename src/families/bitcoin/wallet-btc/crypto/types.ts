import { DerivationModes } from "../types";

// all things derivation
export interface DerivationMode {
  [index: string]: DerivationModes;
}

export interface ICrypto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;
  derivationMode: DerivationMode;
  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string;
  getDerivationMode(address: string): string;

  toOutputScript(address: string): Buffer;
  validateAddress(address: string): boolean;
}

export type Currency =
  | "bitcoin"
  | "bitcoin_cash"
  | "litecoin"
  | "dash"
  | "qtum"
  | "zcash"
  | "bitcoin_gold"
  | "dogecoin"
  | "digibyte"
  | "komodo"
  | "pivx"
  | "zencash"
  | "vertcoin"
  | "peercoin"
  | "viacoin"
  | "stakenet"
  | "stealthcoin"
  | "bitcoin_testnet";
