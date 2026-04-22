import { faker } from "@faker-js/faker";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CeloAccount, Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");

const accountFixture: CeloAccount = {
  type: "Account",
  id: faker.string.uuid(),
  seedIdentifier: faker.string.uuid(),
  derivationMode: "",
  index: faker.number.int(),
  freshAddress: "address",
  freshAddressPath: "derivationPath",
  used: true,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: faker.date.past(),
  blockHeight: faker.number.int({ min: 100_000, max: 200_000 }),
  currency,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: emptyHistoryCache,
  swapHistory: [],
  celoResources: {
    registrationStatus: false,
    lockedBalance: BigNumber(0),
    nonvotingLockedBalance: BigNumber(0),
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: BigNumber(0),
  },
};

const usdcToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "celo/erc20/usdc",
  contractAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
  parentCurrency: currency,
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 6,
    },
  ],
} as TokenCurrency;

const usdtToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "celo/erc20/usdt",
  contractAddress: "0x617f3112bf5397d0467d315cc709ef968d9ba546",
  parentCurrency: currency,
  name: "Tether USD",
  ticker: "USDT",
  units: [
    {
      name: "USDT",
      code: "USDT",
      magnitude: 6,
    },
  ],
} as TokenCurrency;

const usdcTokenAccount: TokenAccount = {
  id: "usdcTokenAccountId",
  type: "TokenAccount",
  parentId: accountFixture.id,
  token: usdcToken,
  balance: BigNumber(1000000000), // 1000 USDC in 6 decimals
  spendableBalance: BigNumber(1000000000),
  creationDate: faker.date.past(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: {
      latestDate: null,
      balances: [],
    },
    DAY: {
      latestDate: null,
      balances: [],
    },
    WEEK: {
      latestDate: null,
      balances: [],
    },
  },
  swapHistory: [],
};

const usdtTokenAccount: TokenAccount = {
  id: "usdtTokenAccountId",
  type: "TokenAccount",
  parentId: accountFixture.id,
  token: usdtToken,
  balance: BigNumber(500000000), // 500 USDT in 6 decimals
  spendableBalance: BigNumber(500000000),
  creationDate: faker.date.past(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: {
      latestDate: null,
      balances: [],
    },
    DAY: {
      latestDate: null,
      balances: [],
    },
    WEEK: {
      latestDate: null,
      balances: [],
    },
  },
  swapHistory: [],
};

const subAccounts = [
  {
    id: "subAccountId",
    type: "TokenAccount",
    parentId: accountFixture.id,
    token: {
      type: "TokenCurrency",
      id: "celoToken",
      contractAddress: "contract_address",
      parentCurrency: currency,
    } as TokenCurrency,
    balance: BigNumber(212),
    spendableBalance: BigNumber(212),
    creationDate: faker.date.past(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    swapHistory: [],
  },
  usdcTokenAccount,
  usdtTokenAccount,
] as TokenAccount[];

const accountWithTokenAccountFixture = {
  ...accountFixture,
  subAccounts,
};

const transactionFixture: Transaction = {
  amount: new BigNumber(10),
  recipient: "recipient",
  useAllAmount: false,
  family: "celo",
  mode: "send",
  index: 0,
  fees: null,
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

const tokenTransactionFixture: Transaction = {
  ...transactionFixture,
  subAccountId: "subAccountId",
};

const transactionWithUsdcFeeFixture: Transaction = {
  ...transactionFixture,
  feeCurrency: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyUnwrapped: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyAccountId: usdcTokenAccount.id,
};

const tokenTransactionWithUsdcFeeFixture: Transaction = {
  ...tokenTransactionFixture,
  feeCurrency: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyUnwrapped: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyAccountId: usdcTokenAccount.id,
};

const tokenTransactionWithUsdtFeeFixture: Transaction = {
  ...tokenTransactionFixture,
  feeCurrency: "0x617f3112bf5397d0467d315cc709ef968d9ba546" as `0x${string}`,
  feeCurrencyUnwrapped: "0x617f3112bf5397d0467d315cc709ef968d9ba546" as `0x${string}`,
  feeCurrencyAccountId: usdtTokenAccount.id,
};

// Transaction where fees are paid in the same token as the send (USDC)
const usdcTransactionWithSameTokenFeeFixture: Transaction = {
  ...transactionFixture,
  subAccountId: usdcTokenAccount.id,
  feeCurrency: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyUnwrapped: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
  feeCurrencyAccountId: usdcTokenAccount.id,
};

export {
  accountFixture,
  accountWithTokenAccountFixture,
  transactionFixture,
  tokenTransactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
  tokenTransactionWithUsdtFeeFixture,
  usdcTransactionWithSameTokenFeeFixture,
  usdcToken,
  usdtToken,
  usdcTokenAccount,
  usdtTokenAccount,
};
