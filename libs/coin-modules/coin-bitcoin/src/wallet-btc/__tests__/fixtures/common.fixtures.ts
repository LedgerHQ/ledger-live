import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import hash from "object-hash";
import type {
  AddressFormat,
  BitcoinSignature,
  BitcoinSigner,
  BitcoinXPub,
  CreateTransaction,
  SignerTransaction,
} from "../../../signer";
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

export class MockBtcSigner implements BitcoinSigner {
  // eslint-disable-next-line class-methods-use-this
  async getWalletPublicKey(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts: { verify?: boolean; format?: AddressFormat },
  ) {
    switch (path) {
      case "44'/0'":
        return {
          publicKey:
            "04c621f37493d99f39ca12fb02ba7fe1687b1650b875dcb6733f386a98958e6556fc95dcecb6ac41af0a5296965751b1598aa475a537474bab5b316fcdc1196568",
          chainCode: "a45d311c31a80bf06cc38d8ed7934bd1e8a7b2d48b2868a70258a86e094bacfb",
          bitcoinAddress: "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D",
        };
      case "44'/0'/0'":
        return {
          publicKey:
            "04d52d1ad9311c5a3d542fa652fbd7d7b0be70109e329d359704d9f2946f8eb52a829c23f8b980c5f7b6c51bf446b21f3dc80c865095243c9215dbf9f3cb6403b8",
          chainCode: "0bd3e45edca4d8a466f523a2c4094c412d25c36d5298b2d3a29938151a8d37fe",
          bitcoinAddress: "1FHa4cuKdea21ByTngP9vz3KYDqqQe9SsA",
        };
      default:
        throw new Error("not supported");
    }
  }

  async createPaymentTransaction(arg: CreateTransaction) {
    return hash(arg);
  }

  getWalletXpub(_arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub> {
    return Promise.reject(new Error("not implemented"));
  }
  signMessage(_path: string, _messageHex: string): Promise<BitcoinSignature> {
    return Promise.reject(new Error("not implemented"));
  }
  signPsbtBuffer(_psbtBuffer: Buffer): Promise<{ psbt: Buffer; tx?: string }> {
    return Promise.reject(new Error("not implemented"));
  }
  splitTransaction(
    _transactionHex: string,
    _isSegwitSupported: boolean | null | undefined,
    _hasExtraData: boolean | null | undefined,
    _additionals: Array<string> | null | undefined,
  ): SignerTransaction {
    // Stub
    return {
      version: Buffer.from(""),
      inputs: [],
      outputs: [],
    };
  }
}
