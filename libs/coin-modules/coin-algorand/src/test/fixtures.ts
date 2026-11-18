import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { AlgoAccount } from "../network";
import type { AlgorandAccount, Transaction } from "../types";

export const SENDER = "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q";
export const FUNDED_RECIPIENT = "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI";
export const UNFUNDED_RECIPIENT = "MVE6C3XB4JBKXKORC3NLAWFW4M7EY3MADU6L72DADFP4NZBJIAYXGSLN3Y";
export const NOT_OPTED_IN_RECIPIENT = "ZQVVJ2S4XWS542KXBBVIINOEHIDOEZKZWK725PWFNN2I5RNCUBI53RT2EY";
export const EMPTY_SENDER = "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4";

export const ASSET_ID = "312769";

export const ASA_TOKEN = {
  type: "TokenCurrency",
  id: `algorand/asa/${ASSET_ID}`,
  contractAddress: ASSET_ID,
  parentCurrencyId: "algorand",
  tokenType: "asa",
  name: "Test ASA",
  ticker: "TASA",
  units: [{ name: "TASA", code: "TASA", magnitude: 6 }],
} as unknown as TokenCurrency;

const parentIdOf = (address: string) => `js:2:algorand:${address}:`;

export const buildTokenAccount = (address: string, balance: string): TokenAccount =>
  ({
    type: "TokenAccount",
    id: `${parentIdOf(address)}+${ASSET_ID}`,
    parentId: parentIdOf(address),
    token: ASA_TOKEN,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations: [],
    pendingOperations: [],
  }) as unknown as TokenAccount;

export const buildAccount = ({
  address = SENDER,
  balance = "1167089",
  tokenBalance = "5000000",
  nbAssets = 1,
  rewards = "0",
}: {
  address?: string;
  balance?: string;
  tokenBalance?: string | null;
  nbAssets?: number;
  rewards?: string;
} = {}): AlgorandAccount =>
  ({
    type: "Account",
    id: parentIdOf(address),
    currency: { id: "algorand", name: "Algorand" },
    freshAddress: address,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    subAccounts: tokenBalance === null ? [] : [buildTokenAccount(address, tokenBalance)],
    algorandResources: { nbAssets, rewards: new BigNumber(rewards) },
  }) as unknown as AlgorandAccount;

export const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "algorand",
    mode: "send",
    amount: new BigNumber(100000),
    recipient: FUNDED_RECIPIENT,
    fees: new BigNumber(1000),
    useAllAmount: false,
    memo: undefined,
    assetId: null,
    subAccountId: null,
    ...overrides,
  }) as unknown as Transaction;

export const buildNetworkAccount = (
  address: string,
  { balance = "5000000", assets = [] }: { balance?: string; assets?: string[] } = {},
): AlgoAccount => ({
  round: 50000000,
  address,
  balance: new BigNumber(balance),
  pendingRewards: new BigNumber(0),
  assets: assets.map(assetId => ({ assetId, balance: new BigNumber(1) })),
});
