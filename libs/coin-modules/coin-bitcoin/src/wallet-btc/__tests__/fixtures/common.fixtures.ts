import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ICrypto } from "../../crypto/types";

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
