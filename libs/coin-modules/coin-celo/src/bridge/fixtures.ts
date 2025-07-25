import { CeloAccount, Transaction } from "../types";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import BigNumber from "bignumber.js";
import { faker } from "@faker-js/faker";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TokenAccount } from "@ledgerhq/types-live";

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
};

const tokenTransactionFixture: Transaction = {
  ...transactionFixture,
  subAccountId: "subAccountId",
};

export {
  accountFixture,
  accountWithTokenAccountFixture,
  transactionFixture,
  tokenTransactionFixture,
};
