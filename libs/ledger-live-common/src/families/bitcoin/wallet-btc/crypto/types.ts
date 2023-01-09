export interface ICrypto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;
  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string>;
  customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string>;
  toOutputScript(address: string): Buffer;
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
  | "pivx"
  | "zencash"
  | "vertcoin"
  | "peercoin"
  | "viacoin"
  | "stealthcoin"
  | "decred"
  | "bitcoin_testnet";
