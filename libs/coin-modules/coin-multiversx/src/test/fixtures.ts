import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createTransaction } from "../createTransaction";
import type { MultiversXAccount, MultiversXDelegation, Transaction } from "../types";

export const ACCOUNT_ADDRESS = "erd1vgfp3g7azqjx4wsmtt7067m0l62v3psmqzr24j6xvywj2tlz0gesvyzsq2";
export const OTHER_ADDRESS = "erd1pm3gje2lmd5vyldcvuy6jpxgde4rapjpujvujkee6a7jw2zmh4tqre796z";
export const DELEGATION_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

export const MEX_TOKEN = {
  type: "TokenCurrency",
  id: "elrond/esdt/4d45582d343535633537",
  contractAddress: "MEX-455c57",
  parentCurrencyId: "elrond",
  tokenType: "esdt",
  name: "xExchange",
  ticker: "MEX",
  units: [{ name: "MEX", code: "MEX", magnitude: 18 }],
} as unknown as TokenCurrency;

export const EGLD_BALANCE = "5000000000000000000";
export const MEX_BALANCE = "100";

const parentId = `js:2:elrond:${ACCOUNT_ADDRESS}:`;

export const buildTokenAccount = (balance: string = MEX_BALANCE): TokenAccount =>
  ({
    type: "TokenAccount",
    id: encodeTokenAccountId(parentId, MEX_TOKEN),
    parentId,
    token: MEX_TOKEN,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations: [],
    pendingOperations: [],
  }) as unknown as TokenAccount;

export const buildAccount = ({
  balance = EGLD_BALANCE,
  delegations = [],
  withToken = false,
}: {
  balance?: string;
  delegations?: MultiversXDelegation[];
  withToken?: boolean;
} = {}): MultiversXAccount =>
  ({
    type: "Account",
    id: parentId,
    currency: {
      id: "elrond",
      name: "MultiversX",
      units: [{ name: "EGLD", code: "EGLD", magnitude: 18 }],
    },
    freshAddress: ACCOUNT_ADDRESS,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    subAccounts: withToken ? [buildTokenAccount()] : [],
    multiversxResources: { nonce: 3, delegations, isGuarded: false },
  }) as unknown as MultiversXAccount;

export const buildDelegation = (userActiveStake: string): MultiversXDelegation => ({
  address: ACCOUNT_ADDRESS,
  contract: DELEGATION_CONTRACT,
  userUnBondable: "0",
  userActiveStake,
  claimableRewards: "0",
  userUndelegatedList: [],
});

export const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...createTransaction({} as MultiversXAccount),
  recipient: OTHER_ADDRESS,
  amount: new BigNumber(100000000),
  ...overrides,
});
