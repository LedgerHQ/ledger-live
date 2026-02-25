import { BigNumber } from "bignumber.js";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiAccount } from "./bridge";

export const createFixtureAccount = (overrides = {}) =>
  ({
    type: "Account",
    id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
    used: true,
    seedIdentifier: "99807c4b6e1b8b25120f633f5f7816a393e4d3e7f84bdf24bd8afe725911be91",
    derivationMode: "sui",
    index: 0,
    freshAddress: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
    freshAddressPath: "44'/784'/0'/0'/0'",
    blockHeight: 10,
    creationDate: new Date(),
    balance: BigNumber(17997970360),
    spendableBalance: BigNumber(17997970360),
    operations: [],
    operationsCount: 2,
    pendingOperations: [],
    currency: {
      type: "CryptoCurrency",
      id: "sui",
      coinType: 784,
      name: "Sui",
      managerAppName: "Sui",
      ticker: "SUI",
      scheme: "sui",
      color: "#000",
      family: "sui",
      units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
      explorerViews: [
        {
          tx: "https://suiscan.xyz/mainnet/tx/$hash",
          address: "https://suiscan.xyz/mainnet/account/$address",
        },
        {
          tx: "https://suivision.xyz/txblock/$hash",
          address: "https://suivision.xyz/account/$address",
        },
      ],
    },
    lastSyncDate: new Date(),
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: {
        balances: [0],
        latestDate: new Date().getMilliseconds(),
      },
      DAY: { balances: [0], latestDate: new Date().getMilliseconds() },
      WEEK: { balances: [0], latestDate: new Date().getMilliseconds() },
    },
    subAccounts: [],
    suiResources: { nonce: 0 },
    ...overrides,
  }) as SuiAccount;

export const createFixtureTransaction = (overrides = {}) => ({
  family: "sui" as const,
  mode: "send" as const,
  coinType: DEFAULT_COIN_TYPE,
  amount: BigNumber(3000000000),
  recipient: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
  useAllAmount: false,
  fees: BigNumber(3976000),
  errors: {},
  skipVerify: true,
  ...overrides,
});

export const createFixtureOperation = (overrides = {}) => ({
  hash: "44298e5b1b7d73efc",
  fee: BigNumber(3976000),
  blockHash: null,
  blockHeight: null,
  extra: { transferAmount: BigNumber(1000000000) },
  id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui--OUT",
  type: "OUT" as const,
  value: BigNumber(1003976000),
  senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
  recipients: ["0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24"],
  accountId: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
  date: new Date(),
  ...overrides,
});
