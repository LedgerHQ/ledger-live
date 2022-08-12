import BigNumber from "bignumber.js";
import eIP712Message from "@ledgerhq/hw-app-eth/tests/sample-messages/0.json";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { TypedMessageData } from "../../families/ethereum/types";
import { prepareMessageToSign } from "./index";
import { MessageData } from "./types";

const eIP712MessageHex =
  "7b0d0a2020202022646f6d61696e223a207b0d0a202020202020202022636861696e4964223a20352c0d0a2020202020202020226e616d65223a20224574686572204d61696c222c0d0a202020202020202022766572696679696e67436f6e7472616374223a2022307843634343636363634343434363434343434343634363436363436343434363436363636363636343222c0d0a20202020202020202276657273696f6e223a202231220d0a202020207d2c0d0a20202020226d657373616765223a207b0d0a202020202020202022636f6e74656e7473223a202248656c6c6f2c20426f6221222c0d0a20202020202020202266726f6d223a207b0d0a202020202020202020202020226e616d65223a2022436f77222c0d0a2020202020202020202020202277616c6c657473223a205b0d0a2020202020202020202020202020202022307843443261336439463933384531334344393437456330354162433746453733344466384444383236222c0d0a2020202020202020202020202020202022307844656144626565666445416462656566644561646245454664656164626545466445614462656546220d0a2020202020202020202020205d0d0a20202020202020207d2c0d0a202020202020202022746f223a207b0d0a202020202020202020202020226e616d65223a2022426f62222c0d0a2020202020202020202020202277616c6c657473223a205b0d0a2020202020202020202020202020202022307862426242424242626242424262626242626242626262624242624262626262426242626242426242222c0d0a2020202020202020202020202020202022307842304264614265613537423042444142654135376230626441424541353762304244616245613537222c0d0a2020202020202020202020202020202022307842304230623062306230623042303030303030303030303030303030303030303030303030303030220d0a2020202020202020202020205d0d0a20202020202020207d0d0a202020207d2c0d0a20202020227072696d61727954797065223a20224d61696c222c0d0a20202020227479706573223a207b0d0a202020202020202022454950373132446f6d61696e223a205b0d0a2020202020202020202020207b20226e616d65223a20226e616d65222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a202276657273696f6e222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a2022636861696e4964222c202274797065223a202275696e7432353622207d2c0d0a2020202020202020202020207b20226e616d65223a2022766572696679696e67436f6e7472616374222c202274797065223a20226164647265737322207d0d0a20202020202020205d2c0d0a2020202020202020224d61696c223a205b0d0a2020202020202020202020207b20226e616d65223a202266726f6d222c202274797065223a2022506572736f6e22207d2c0d0a2020202020202020202020207b20226e616d65223a2022746f222c202274797065223a2022506572736f6e22207d2c0d0a2020202020202020202020207b20226e616d65223a2022636f6e74656e7473222c202274797065223a2022737472696e6722207d0d0a20202020202020205d2c0d0a202020202020202022506572736f6e223a205b0d0a2020202020202020202020207b20226e616d65223a20226e616d65222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a202277616c6c657473222c202274797065223a2022616464726573735b5d22207d0d0a20202020202020205d0d0a202020207d0d0a7d0d0a";

describe("prepareMessageToSign", () => {
  it("returns the prepared data from a simple string", () => {
    // Given
    const crypto = createCryptoCurrency("ethereum");
    const account = createAccount(crypto);
    const message = "4d6573736167652064652074657374";
    const expectedRawMessage = "0x4d6573736167652064652074657374";

    // When
    let result: MessageData | TypedMessageData | undefined;
    let error: unknown = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err;
    }

    // Then
    expect(error).toBeNull();
    expect(result).toEqual({
      currency: crypto,
      path: "44'/60'/0'/0/0",
      derivationMode: "ethM",
      message: "Message de test",
      rawMessage: expectedRawMessage,
    });
  });

  it("returns the prepared data from an EIP-712 format message", () => {
    // Given
    const crypto = createCryptoCurrency("ethereum");
    const account = createAccount(crypto);
    const message = eIP712MessageHex;

    // When
    let result: MessageData | TypedMessageData | undefined;
    let error: unknown = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err;
    }

    // Then
    expect(error).toBeNull();
    expect(result).toEqual({
      currency: crypto,
      path: "44'/60'/0'/0/0",
      derivationMode: "ethM",
      message: eIP712Message,
    });
  });

  it("returns an error if account is not linked to a crypto able to sign a message", () => {
    // Given
    const crypto = createCryptoCurrency("mycoin");
    const account = createAccount(crypto);
    const message = "4d6573736167652064652074657374";

    // When
    let result: MessageData | TypedMessageData | undefined;
    let error: Error | null = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err as Error;
    }

    // Then
    expect(result).toBeUndefined();
    expect(error).toEqual(Error("Crypto does not support signMessage"));
  });
});

const createCryptoCurrency = (family: string): CryptoCurrency => ({
  type: "CryptoCurrency",
  id: "testCoinId",
  coinType: 8008,
  name: "MyCoin",
  managerAppName: "MyCoin",
  ticker: "MYC",
  countervalueTicker: "MYC",
  scheme: "mycoin",
  color: "#ff0000",
  family,
  units: [
    {
      name: "MYC",
      code: "MYC",
      magnitude: 8,
    },
    {
      name: "SmallestUnit",
      code: "SMALLESTUNIT",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://mycoinexplorer.com/account/$address",
      tx: "https://mycoinexplorer.com/transaction/$hash",
      token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
    },
  ],
});

const createAccount = (crypto: CryptoCurrency): Account => ({
  type: "Account",
  id: "ethereumjs:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  derivationMode: "ethM",
  index: 0,
  freshAddress: "0x01",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [],
  name: "Ethereum 1",
  starred: false,
  used: false,
  balance: new BigNumber("51281813126095913"),
  spendableBalance: new BigNumber("51281813126095913"),
  creationDate: new Date(),
  blockHeight: 8168983,
  currency: crypto,
  unit: {
    name: "satoshi",
    code: "BTC",
    magnitude: 5,
  },
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: undefined,
    },
    DAY: {
      balances: [],
      latestDate: undefined,
    },
    WEEK: {
      balances: [],
      latestDate: undefined,
    },
  },
  swapHistory: [],
});
