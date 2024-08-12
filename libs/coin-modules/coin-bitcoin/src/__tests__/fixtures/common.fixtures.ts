import BigNumber from "bignumber.js";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BitcoinAccount, BitcoinResources, NetworkInfoRaw } from "../../types";
import {
  AddressFormat,
  BitcoinAddress,
  BitcoinSignature,
  BitcoinSigner,
  BitcoinXPub,
  CreateTransaction,
  SignerTransaction,
} from "../../signer";

export const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      {
        key: "0",
        speed: "high",
        feePerByte: "3",
      },
      {
        key: "1",
        speed: "standard",
        feePerByte: "2",
      },
      {
        key: "2",
        speed: "low",
        feePerByte: "1",
      },
    ],
    defaultFeePerByte: "1",
  },
};

export function createFixtureAccount(account?: Partial<BitcoinAccount>): BitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;

  const bitcoinResources: BitcoinResources = account?.bitcoinResources || {
    utxos: [],
  };

  const freshAddress = {
    address: "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: "E0A538D5-5EE7-4E37-BB57-F373B08B8580",
    seedIdentifier: "FD5EAFE3-8C7F-4565-ADFA-2A1A2067322A",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    bitcoinResources,
  };
}

export const mockXpubPubKey = {
  xpub: [
    "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
  ],
  pubKey: [
    {
      publicKey:
        "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
      bitcoinAddress: "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64",
      chainCode: "",
    },
  ],
};

export const mockSigner: BitcoinSigner = {
  getWalletXpub: (_arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub> =>
    Promise.resolve(""),
  getWalletPublicKey: (
    _path: string,
    _opts?: {
      verify?: boolean;
      format?: AddressFormat;
    },
  ): Promise<BitcoinAddress> => {
    return Promise.resolve({
      publicKey: "",
      bitcoinAddress: "",
      chainCode: "",
    });
  },
  signMessage: (_path: string, _messageHex: string): Promise<BitcoinSignature> =>
    Promise.resolve({
      v: 0,
      r: "123",
      s: "456",
    }),
  splitTransaction: (
    _transactionHex: string,
    _isSegwitSupported: boolean | null | undefined,
    _hasExtraData: boolean | null | undefined,
    _additionals: Array<string> | null | undefined,
  ): SignerTransaction => ({
    version: Buffer.from(""),
    inputs: [
      {
        prevout: Buffer.from(""),
        script: Buffer.from(""),
        sequence: Buffer.from(""),
      },
    ],
  }),
  createPaymentTransaction: (_arg: CreateTransaction): Promise<string> =>
    Promise.resolve("createPaymentTransactionReturn"),
};

export const mockSignerContext = <T>(
  _deviceId: string,
  _crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> =>
  fn({
    getWalletXpub: (_arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub> =>
      Promise.resolve(""),
    getWalletPublicKey: (
      _path: string,
      _opts?: {
        verify?: boolean;
        format?: AddressFormat;
      },
    ): Promise<BitcoinAddress> => {
      return Promise.resolve({
        publicKey: "",
        bitcoinAddress: "",
        chainCode: "",
      });
    },
    signMessage: (_path: string, _messageHex: string): Promise<BitcoinSignature> =>
      Promise.resolve({
        v: 0,
        r: "123",
        s: "456",
      }),
    splitTransaction: (
      _transactionHex: string,
      _isSegwitSupported: boolean | null | undefined,
      _hasExtraData: boolean | null | undefined,
      _additionals: Array<string> | null | undefined,
    ): SignerTransaction => ({
      version: Buffer.from(""),
      inputs: [
        {
          prevout: Buffer.from(""),
          script: Buffer.from(""),
          sequence: Buffer.from(""),
        },
      ],
    }),
    createPaymentTransaction: (_arg: CreateTransaction): Promise<string> => Promise.resolve(""),
  });
