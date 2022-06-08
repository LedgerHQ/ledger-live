import BigNumber from "bignumber.js";
import { Account, CryptoCurrency } from "../../types";
import prepareMessageToSign from "./signMessage";

describe("prepareMessageToSign", () => {
  it("returns the prepared data from a simple string", () => {
    // Given
    const crypto = createCryptoCurrency();
    const account = createAccount(crypto);

    const message = "Message de test";
    const expectedRawMessage = "4d6573736167652064652074657374";

    // When
    const result = prepareMessageToSign(account, message);

    // Then
    expect(result).toEqual({
      currency: crypto,
      path: "44'/60'/0'/0/0",
      derivationMode: "ethM",
      message: "Message de test",
      rawMessage: expectedRawMessage,
    });
  });
});

const createCryptoCurrency = (): CryptoCurrency => ({
  type: "CryptoCurrency",
  id: "testCoinId",
  coinType: 8008,
  name: "MyCoin",
  managerAppName: "MyCoin",
  ticker: "MYC",
  countervalueTicker: "MYC",
  scheme: "mycoin",
  color: "#ff0000",
  family: "mycoin",
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
