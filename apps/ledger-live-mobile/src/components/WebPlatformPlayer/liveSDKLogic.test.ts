import BigNumber from "bignumber.js";
import {
  CryptoCurrency,
  CryptoCurrencyId,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";

import prepareSignTransaction from "./liveSDKLogic";

// Fake the support of the test currency
jest.mock("@ledgerhq/coin-framework/currencies/support", () => ({
  isCurrencySupported: () => true,
}));

describe("prepareSignTransaction", () => {
  it("returns a Transaction", () => {
    // Given
    const parentAccount = createAccount("12");
    const childAccount = createTokenAccount(
      "22",
      "ethereumjs:2:ethereum:0x012:",
    );
    const expectedResult = {
      amount: new BigNumber("1000"),
      data: Buffer.from([]),
      estimatedGasLimit: null,
      family: "ethereum",
      feeCustomUnit: { code: "Gwei", magnitude: 9, name: "Gwei" },
      feesStrategy: "medium",
      gasPrice: new BigNumber("700000"),
      gasLimit: new BigNumber("1200000"),
      userGasLimit: new BigNumber("1200000"),
      mode: "send",
      networkInfo: null,
      nonce: 8,
      recipient: "0x0123456",
      subAccountId: "ethereumjs:2:ethereum:0x022:",
      useAllAmount: false,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    };

    // When
    const result = prepareSignTransaction(
      childAccount,
      parentAccount,
      createEtherumTransaction(),
    );

    // Then
    expect(result).toEqual(expectedResult);
  });
});

// *** UTIL FUNCTIONS ***
function createEtherumTransaction(): Partial<
  Transaction & { gasLimit: BigNumber }
> {
  return {
    family: "ethereum",
    amount: new BigNumber("1000"),
    recipient: "0x0123456",
    nonce: 8,
    data: Buffer.from("Some data...", "hex"),
    gasPrice: new BigNumber("700000"),
    gasLimit: new BigNumber("1200000"),
  };
}

const createCryptoCurrency = (family: string): CryptoCurrency => ({
  type: "CryptoCurrency",
  id: "testCoinId" as CryptoCurrencyId,
  coinType: 8008,
  name: "ethereum",
  managerAppName: "ethereum",
  ticker: "MYC",
  countervalueTicker: "MYC",
  scheme: "ethereum",
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
    parentCurrency: defaultEthCryptoFamily,
    tokenType: "",
    // -- CurrencyCommon
    name: "",
    ticker: "",
    units: [],
  };
}
