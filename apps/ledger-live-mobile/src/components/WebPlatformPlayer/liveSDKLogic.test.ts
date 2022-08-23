import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { RawPlatformTransaction } from "@ledgerhq/live-common/platform/rawTypes";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import prepareSignTransaction from "./liveSDKLogic";

// Fake the support of the test currency
jest.mock("@ledgerhq/live-common/currencies/support", () => ({
  isCurrencySupported: () => true,
}));

describe("prepareSignTransaction", () => {
  it("returns a Transaction", () => {
    // Given
    const parentAccount = createAccount("12");
    const accounts = [
      ...Array.of("11", "13").map(val => createAccount(val)),
      parentAccount,
      ...Array.of("21", "22", "23").map(val =>
        createTokenAccount(val, "ethereumjs:2:ethereum:0x012:"),
      ),
    ];
    const accountId = "ethereumjs:2:ethereum:0x022:";
    const mockTracking = {
      platformSignTransactionFail: jest.fn(),
    };
    const expectedResult = {
      parentAccount,
      tx: {
        amount: new BigNumber("1000"),
        data: Buffer.from([]),
        estimatedGasLimit: null,
        family: "ethereum",
        feeCustomUnit: { code: "Gwei", magnitude: 9, name: "Gwei" },
        feesStrategy: "custom",
        gasPrice: new BigNumber("NaN"),
        mode: "send",
        networkInfo: null,
        nonce: 8,
        recipient: "0x0123456",
        subAccountId: "ethereumjs:2:ethereum:0x022:",
        useAllAmount: false,
        userGasLimit: new BigNumber("NaN"),
      },
    };

    // When
    const result = prepareSignTransaction(
      accounts,
      createAppManifest(),
      mockTracking,
      accountId,
      createRawEtherumTransaction(),
    );

    // Then
    expect(result).toEqual(expectedResult);
    expect(mockTracking.platformSignTransactionFail).toBeCalledTimes(0);
  });
});

function createRawEtherumTransaction(): RawPlatformTransaction {
  return {
    family: "ethereum" as any,
    amount: "1000",
    recipient: "0x0123456",
    nonce: 8,
    data: "Some data...",
    gasPrice: "0,7",
    gasLimit: "1,2",
  };
}

function createAppManifest(id = "1"): AppManifest {
  return {
    id,
    private: false,
    name: "New App Manifest",
    url: "https://www.ledger.com",
    homepageUrl: "https://www.ledger.com",
    supportUrl: "https://www.ledger.com",
    icon: null,
    platform: "all",
    apiVersion: "1.0.0",
    manifestVersion: "1.0.0",
    branch: "debug",
    params: undefined,
    categories: [],
    currencies: "*",
    content: {
      shortDescription: {
        en: "short description",
      },
      description: {
        en: "description",
      },
    },
    permissions: [],
    domains: [],
  };
}

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

const defaultEthCryptoFamily = createCryptoCurrency("ethereum");
const createAccount = (
  id: string,
  crypto: CryptoCurrency = defaultEthCryptoFamily,
): Account => ({
  type: "Account",
  id: `ethereumjs:2:ethereum:0x0${id}:`,
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

function createTokenAccount(id = "32", parentId = "whatever"): TokenAccount {
  return {
    type: "TokenAccount",
    id: `ethereumjs:2:ethereum:0x0${id}:`,
    parentId,
    token: createTokenCurrency(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    starred: false,
    balanceHistoryCache: {
      WEEK: { latestDate: null, balances: [] },
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  };
}

function createTokenCurrency(): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: "3",
    contractAddress: "",
    parentCurrency: createCryptoCurrency("eth"),
    tokenType: "",
    // -- CurrencyCommon
    name: "",
    ticker: "",
    units: [],
  };
}
