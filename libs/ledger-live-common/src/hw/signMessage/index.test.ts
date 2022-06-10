import BigNumber from "bignumber.js";
import { Account, CryptoCurrency } from "../../types";
import { prepareMessageToSign } from "./index";
import { MessageData } from "./types";

describe("prepareMessageToSign", () => {
  it("returns the prepared data from a simple string", () => {
    // Given
    const crypto = createCryptoCurrency("ethereum");
    const account = createAccount(crypto);
    const message = "Message de test";
    const expectedRawMessage = "0x4d6573736167652064652074657374";

    // When
    let result: MessageData | null = null;
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

  it("returns an error if account is not linked to a crypto able to sign a message", () => {
    // Given
    const crypto = createCryptoCurrency("mycoin");
    const account = createAccount(crypto);
    const message = "Message de test";

    // When
    let result: MessageData | null = null;
    let error: Error | null = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err as Error;
    }

    // Then
    expect(result).toBeNull();
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
