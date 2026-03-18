import type { BitcoinJS } from "coininfo";
export interface ICrypto {
  network: BitcoinJS;
  getPubkeyAt(xpub: string, account: number, index: number): Promise<Buffer>;
  getAddress(derivationMode: string, xpub: string, account: number, index: number): Promise<string>;
  customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number,
  ): Promise<string>;
  toOutputScript(address: string): Buffer;
  toOpReturnOutputScript(data: Buffer): Buffer;
  validateAddress(address: string): boolean;
  isTaprootAddress(address: string): boolean;
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
  | "zencash"
  | "decred"
  | "bitcoin_testnet"
  | "bitcoin_regtest";
