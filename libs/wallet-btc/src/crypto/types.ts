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

// Minimal currency descriptor injected by the consumer. Replaces
// @ledgerhq/types-cryptoassets (CryptoCurrency) and @ledgerhq/live-env (getEnv):
// the caller resolves the explorer id and endpoint and passes them in, so
// wallet-btc has no dependency on the Ledger currency registry or env.
export type WalletBtcCurrency = {
  /** Currency id, e.g. "bitcoin". */
  id: string;
  /** Ledger explorer id, e.g. "btc"; defaults to `id` when omitted. */
  explorerId?: string;
  /** Resolved Ledger explorer base endpoint (caller-provided, e.g. from EXPLORER env). */
  explorerEndpoint: string;
};

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
