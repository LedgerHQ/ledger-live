import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

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

export const mockCryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  family: "bitcoin",
  coinType: 0,
  scheme: "native_segwit",
  units: [
    {
      name: "BTC",
      code: "BTC",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://blockchain.info/tx/{txid}",
      address: "https://blockchain.info/address/{address}",
    },
  ],
  ticker: "BTC",
  explorerId: "btc",
  color: "#FF0000",
  managerAppName: "Bitcoin",
} as CryptoCurrency;

export const getMockAccount = (derivationMode: string) => {
  const bitcoinCryptoCurrency = getCryptoCurrencyById("bitcoin");
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
