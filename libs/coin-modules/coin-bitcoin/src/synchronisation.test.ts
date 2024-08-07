import { makeGetAccountShape } from "./synchronisation";
import { BigNumber } from "bignumber.js";
import MockBtcSigner from "./mockBtcSigner";
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
import { DerivationModes } from "./wallet-btc";
import { createFixtureAccount } from "./hw-signMessage.test";

// jest.mock("@ledgerhq/live-common/lib/account", () => ({
//   getAccountCurrency: jest.fn(),
//   getAccountUnit: jest.fn(),
// }));

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
const mockCryptoCurrency = {
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

const mockStartSpan = jest.fn().mockReturnValue({
  finish: jest.fn(),
});
describe("synchronisation", () => {
  it("should return a function", () => {
    const result = makeGetAccountShape(mockSignerContext, mockStartSpan);
    expect(typeof result).toBe("function");
  });

  it("should return an account shape with the correct properties", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext, mockStartSpan);
    // getAccountCurrency.mockReturnValue({ ticker: "BTC" });
    // getAccountUnit.mockReturnValue({ magnitude: 8 });
    const mockAccount = createFixtureAccount();
    mockAccount.id =
      "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:native_segwit";
    const result = await getAccountShape(
      {
        currency: mockCryptoCurrency,
        address: "0x123",
        index: 1,
        derivationPath: "m/44'/0'/0'/0/1",
        derivationMode: "taproot",
        initialAccount: mockAccount, // { id:  },
      },
      { paginationConfig: {} },
    );
    console.log({ result });
    expect(result).toMatchObject({
      // balance: "0",
      bitcoinResources: {
        utxos: [],
        walletAccount: {
          params: {
            currency: "bitcoin",
            derivationMode: "Taproot",
            index: 1,
            network: "mainnet",
            path: "m/44'",
            xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
          },
          xpub: {
            GAP: 20,
            OUTPUT_VALUE_MAX: 9007199254740991,
            // crypto: { network: [Object] },
            // currentBlockHeight: 855786,
            derivationMode: "Taproot",
            explorer: { baseUrl: "https://explorers.api.live.ledger.com/blockchain/v4/btc" },
            freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
            freshAddressIndex: 0,
            // storage: {
            //   accountIndex: [Object],
            //   addressCache: [Object],
            //   primaryIndex: [Object],
            //   spentUtxos: [Object],
            //   txs: [Array],
            //   unspentUtxos: [Object],
            // },
            // syncedBlockHeight: 855786,
            txsSyncArraySize: 1000,
            xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
          },
        },
      },
      // blockHeight: 855786,
      freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
      freshAddressPath: "m/44'/1'/0/0",
      id: "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:taproot",
      operations: [],
      operationsCount: 0,
      // spendableBalance: "0",
      xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
    });
  });
});
