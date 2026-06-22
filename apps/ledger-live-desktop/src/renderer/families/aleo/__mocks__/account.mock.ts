import BigNumber from "bignumber.js";
import type {
  AleoAccount,
  AleoTokenAccount,
  AleoUnspentRecord,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { aleoCurrency, aleoTokenCurrency } from "./currency.mock";

export const ALEO_ACCOUNT_1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };
export const ALEO_ACCOUNT_2 = { ...genAccount("aleo-2", { currency: aleoCurrency }), index: 1 };
export const ALEO_ACCOUNT_3 = { ...genAccount("aleo-3", { currency: aleoCurrency }), index: 2 };
export const NEW_ALEO_ACCOUNT: Account = {
  ...genAccount("aleo-4", { currency: aleoCurrency }),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  subAccounts: [],
  creationDate: new Date(),
  used: false,
  index: 3,
};

export const ALEO_MAIN_ACCOUNT: AleoAccount = {
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(100_000_000),
    privateBalance: new BigNumber(50_000_000),
    unspentPrivateRecords: [],
    provableApi: null,
    lastPrivateSyncDate: null,
  },
};

export const ALEO_TOKEN_ACCOUNT: AleoTokenAccount = {
  type: "TokenAccount",
  id: "aleo-token-sub-account-id",
  parentId: ALEO_ACCOUNT_1.id,
  token: aleoTokenCurrency,
  balance: new BigNumber(42_000_000),
  spendableBalance: new BigNumber(42_000_000),
  transparentBalance: new BigNumber(42_000_000),
  privateBalance: null,
  unspentPrivateRecords: null,
  creationDate: new Date(),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

export const makeTokenAccount = (records: AleoUnspentRecord[] | null): AleoTokenAccount => ({
  ...ALEO_TOKEN_ACCOUNT,
  unspentPrivateRecords: records,
});
