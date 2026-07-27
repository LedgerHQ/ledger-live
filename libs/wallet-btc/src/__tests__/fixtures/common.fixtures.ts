import type { WalletBtcCurrency } from "../../crypto/types";
import { Account } from "../../account";
import { ICrypto } from "../../crypto/types";
import Xpub from "../../xpub";
import BitcoinLikeStorage from "../../storage";
import BitcoinLikeExplorer from "../../explorer";
import { IStorage } from "../../storage/types";

export const mockCrypto = {
  getAddress: jest.fn(),
  toOutputScript: jest.fn(),
  toOpReturnOutputScript: jest.fn(),
  network: {
    name: "testnet",
  },
} as unknown as jest.Mocked<ICrypto>;

// Test helper: build a wallet-btc currency descriptor (replaces getCryptoCurrencyById
// wallet-btc is dependency-inverted (no currency-registry dependency), so tests inject the
// explorer id explicitly. Map the currencies exercised here to their Ledger explorer code.
const EXPLORER_IDS: Record<string, string> = {
  bitcoin: "btc",
  bitcoin_cash: "bch",
  bitcoin_gold: "btg",
  bitcoin_testnet: "btc_testnet",
  dash: "dash",
  decred: "dcr",
  digibyte: "dgb",
  dogecoin: "doge",
  komodo: "kmd",
  litecoin: "ltc",
  qtum: "qtum",
  zcash: "zec",
  zencash: "zen",
};

export const walletBtcCurrency = (id: string, explorerId?: string): WalletBtcCurrency => ({
  id,
  explorerId: explorerId ?? EXPLORER_IDS[id] ?? id,
  explorerEndpoint: "https://explorers.api.live.ledger.com",
});

export const getMockAccount = (derivationMode: string) => {
  const bitcoinCryptoCurrency = walletBtcCurrency("bitcoin");
  const mockStorage = new BitcoinLikeStorage();

  return {
    params: {
      xpub: "test-xpub",
      path: "test-path",
      index: 0,
      currency: "bitcoin",
      network: "mainnet",
      derivationMode,
    },
    xpub: new Xpub({
      storage: mockStorage,
      explorer: new BitcoinLikeExplorer({ cryptoCurrency: bitcoinCryptoCurrency }),
      crypto: mockCrypto,
      xpub: "test-xpub",
      derivationMode,
    }),
  } as Account;
};

export const mockStorage = {
  addAddress: jest.fn(),
  hasPendingTx: jest.fn().mockReturnValue(false),
  removePendingTxs: jest.fn(),
  appendTxs: jest.fn(),
  hasTx: jest.fn().mockReturnValue(true),
  getUniquesAddresses: jest.fn(),
  getAddressUnspentUtxos: jest.fn().mockReturnValue([]),
  getTx: jest.fn(),
  getLastConfirmedTxBlock: jest.fn(),
  removeTxs: jest.fn(),
  getHighestBlockHeightAndHash: jest.fn(),
  getLastUnconfirmedTx: jest.fn(),
  export: jest.fn(),
  load: jest.fn(),
  exportSync: jest.fn(),
  loadSync: jest.fn(),
} as unknown as jest.Mocked<IStorage>;
