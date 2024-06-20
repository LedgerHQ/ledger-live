import { DatasetTest } from "@ledgerhq/types-live";
// import { testBridge } from "@ledgerhq/coin-framework/test-helpers/bridge-integration-suite";

import type { Transaction } from "./types";
import bitcoin from "./datasets/bitcoin";
import bitcoin_cash from "./datasets/bitcoin_cash";
import bitcoin_gold from "./datasets/bitcoin_gold";
import dash from "./datasets/dash";
import decred from "./datasets/decred";
import digibyte from "./datasets/digibyte";
import dogecoin from "./datasets/dogecoin";
import zencash from "./datasets/zencash";
import litecoin from "./datasets/litecoin";
import pivx from "./datasets/pivx";
import zcash from "./datasets/zcash";

/*
import { createBridges } from "./bridge/js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  AddressFormat,
  BitcoinAddress,
  BitcoinSignature,
  BitcoinSigner,
  BitcoinXPub,
  CreateTransaction,
  SignerTransaction,
} from "./signer";
import { fromTransactionRaw, toTransactionRaw, toTransactionStatusRaw } from "./transaction";
*/

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
    litecoin,
    pivx,
    zcash,
  },
};

/*
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

const xpub = [
  "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
  "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
  "xpub6DEHKg8fgKcbC7ZzoayZKxpDs8PYag9aBvXLhpvZhag3DT2nU5PwLE6xaineM5jciavwNYGUZrdSTcktK6Xu9odBYXN6K2zeou479HUcbsc",
  "xpub6BvkrmBTnBQMW1tBLgY2H6itSqFh9xGAYLGtR8PsKi762NghTQVUkv5gJ3osjMzaqqcfpKgHm2ov7N67A6njxLG8RSU8WwLVN4F596cDmp6",
  "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
  "xpub6CKb86o7RHSD1tDBFKwPgEZ5Q83gnRPG7Bs5HzBRUxcm4dvLEPnSTWP8C7c4P71GgMCk1Fw6xS6Ki4XC6bGAQcxE8gc9KJHXzQnErDtwTa6",
  "xpub6CKb86o7RHSD4ZhRxHBtCWgL2J5MJYrVdurKFkdChDPjLpUt7EpvrsoCaBRCD78Qo7ith2DeCqonWinReuXMfs2bqJiLkcoE4VcwvkvUzEJ",
  "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  "xpub6BuPWhjLqutPY3pENUxwkG3NAQfjLxoHMTAkwzH13rZSzkymZrbKui1MN3KgwiNFsH4AyLM3GkodNo4bTxQXE1kvZiruVUtJLe1bMW1MBBJ",
];
const pubKey = [
  {
    publicKey:
      "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
    bitcoinAddress: "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
    bitcoinAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6DEHKg8fgKcbC7ZzoayZKxpDs8PYag9aBvXLhpvZhag3DT2nU5PwLE6xaineM5jciavwNYGUZrdSTcktK6Xu9odBYXN6K2zeou479HUcbsc",
    bitcoinAddress: "bc1qnqy7vyp0df7tl90mwz9jwca66t6hef4yj9hl6n",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6BvkrmBTnBQMW1tBLgY2H6itSqFh9xGAYLGtR8PsKi762NghTQVUkv5gJ3osjMzaqqcfpKgHm2ov7N67A6njxLG8RSU8WwLVN4F596cDmp6",
    bitcoinAddress: "bc1p3ldd4dsgv7phm4z3ah5zqaap5eferesr9n5ymufhwe0medvlaqfq25rfvz",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
    bitcoinAddress: "34WDB297Z1crydk6CMa1UvUpZ8G4cPXiYE",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6CKb86o7RHSD1tDBFKwPgEZ5Q83gnRPG7Bs5HzBRUxcm4dvLEPnSTWP8C7c4P71GgMCk1Fw6xS6Ki4XC6bGAQcxE8gc9KJHXzQnErDtwTa6",
    bitcoinAddress: "3EyuXJk735CE5oBummZqzzFGN5qSMYLQ9w",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6CKb86o7RHSD4ZhRxHBtCWgL2J5MJYrVdurKFkdChDPjLpUt7EpvrsoCaBRCD78Qo7ith2DeCqonWinReuXMfs2bqJiLkcoE4VcwvkvUzEJ",
    bitcoinAddress: "3DUk27bxJm3y7txoPTK4GGBWcyoW6ibGuh",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
    bitcoinAddress: "1Ktck8TvjnCUj2jNXexzBXJ2ihNikfCDii",
    chainCode: "",
  },
  {
    publicKey:
      "xpub6BuPWhjLqutPY3pENUxwkG3NAQfjLxoHMTAkwzH13rZSzkymZrbKui1MN3KgwiNFsH4AyLM3GkodNo4bTxQXE1kvZiruVUtJLe1bMW1MBBJ",
    bitcoinAddress: "1JepjRPgzuV4hyBTZxftBYqbAaXMygCMRV",
    chainCode: "",
  },
];
const mockSignerContext = <T>(
  _deviceId: string,
  _crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> =>
  fn({
    getWalletXpub: (_arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub> =>
      Promise.resolve(xpub.shift() ?? ""),
    getWalletPublicKey: (
      _path: string,
      _opts?: {
        verify?: boolean;
        format?: AddressFormat;
      },
    ): Promise<BitcoinAddress> => {
      return Promise.resolve(
        pubKey.shift() ?? {
          publicKey: "",
          bitcoinAddress: "",
          chainCode: "",
        },
      );
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

const fakeCoinConfig = (
  _currency: CryptoCurrency,
): { info: { status: { type: "active" | "under_maintenance" } } } => ({
  info: { status: { type: "active" } },
});
const bitcoinBridge = createBridges(
  mockSignerContext,
  { startSpan: mockStartSpan },
  fakeCoinConfig,
);

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
*/
