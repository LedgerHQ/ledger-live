import { DatasetTest } from "@ledgerhq/types-live";
import { testBridge } from "@ledgerhq/coin-framework/test-helpers/bridge-integration-suite";

import type { Transaction } from "./types";
import bitcoin from "./datasets/bitcoin";
import bitcoin_cash from "./datasets/bitcoin_cash";
import bitcoin_gold from "./datasets/bitcoin_gold";
import dash from "./datasets/dash";
import decred from "./datasets/decred";
import digibyte from "./datasets/digibyte";
import dogecoin from "./datasets/dogecoin";
import zencash from "./datasets/zencash";
import komodo from "./datasets/komodo";
import litecoin from "./datasets/litecoin";
import peercoin from "./datasets/peercoin";
import pivx from "./datasets/pivx";
import qtum from "./datasets/qtum";
import vertcoin from "./datasets/vertcoin";
import viacoin from "./datasets/viacoin";
import zcash from "./datasets/zcash";
import { createBridges } from "./bridge/js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AddressFormat, BitcoinAddress, BitcoinSignature, BitcoinSigner, BitcoinXPub, CreateTransaction, SignerTransaction } from "./signer";
import { fromTransactionRaw, toTransactionRaw, toTransactionStatusRaw } from "./transaction";

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js", "mock"],
  currencies: {
    bitcoin,
    bitcoin_cash,
    bitcoin_gold,
    dash,
    decred,
    digibyte,
    dogecoin,
    zencash,
    komodo,
    litecoin,
    peercoin,
    pivx,
    qtum,
    vertcoin,
    viacoin,
    zcash,
  },
};

describe("Bitcoin bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});

const mockStartSpan = (
  _op: string,
  _description?: string,
  _rest?: {
    tags?: any;
    data?: any;
  },
) => {
  return {
    finish: () => {},
  };
};
function extractAddressFromPath(path: string): string {
  return path.split("/")[2].slice(0, -1);
}
const mockSignerContext = <T>(
  _deviceId: string,
  _crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> =>
  fn({
    getWalletXpub: (_arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub> =>
      Promise.resolve(
        "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
      ),
    getWalletPublicKey: (
      _path: string,
      _opts?: {
        verify?: boolean;
        format?: AddressFormat;
      },
    ): Promise<BitcoinAddress> => {
      console.log("DEBUG - getWalletPublicKey", _path, _opts);
      return Promise.resolve({
        publicKey: "",
        bitcoinAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
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
      _hasTimestamp: boolean | null | undefined,
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

const bitcoinBridge = createBridges(mockSignerContext, { startSpan: mockStartSpan });

testBridge({
  implementations: ["js", "mock"],
  currencies: { bitcoin },
  signerValues: [
    "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  ],
  currencyBridge: bitcoinBridge.currencyBridge,
  accountBridge: bitcoinBridge.accountBridge,
  fromTransactionRaw,
  toTransactionRaw,
  toTransactionStatusRaw,
});
