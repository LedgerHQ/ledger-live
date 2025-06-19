import { fn, Mock } from "@storybook/test";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { arbitrumCurrency, ethereumCurrency } from "./useSelectAssetFlow.mock";

export const useGetAccountIds: Mock = fn(() => undefined);
export const getBalanceHistoryWithCountervalue: Mock = fn(() => ({
  history: [
    {
      date: "2025-05-22T15:06:28.976Z",
      value: 119617,
      countervalue: 13261,
    },
  ],
}));
export const getPortfolioCount: Mock = fn(() => 0);
export const useCountervaluesState: Mock = fn(() => {});
export const accountsSelector: Mock = fn(state => state.accounts);
export const counterValueCurrencySelector: Mock = fn(state => state.currency);
export const discreetModeSelector: Mock = fn(state => state.discreet);
export const localeSelector: Mock = fn(state => state.locale);

export const Mocked_ETH_Account: Account[] = [
  {
    type: "Account",
    id: "js:2:ethereum:0x823ePB4bDa11da33a7F1C907D1171e5995Fe33c7:",
    used: true,
    seedIdentifier: "",
    derivationMode: "ethM",
    index: 2,
    freshAddress: "freshAddress",
    freshAddressPath: "",
    blockHeight: 20372078,
    creationDate: new Date(),
    balance: new BigNumber(1).multipliedBy(1e18),
    spendableBalance: new BigNumber(1).multipliedBy(1e18),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    currency: ethereumCurrency,
    lastSyncDate: new Date(),
    swapHistory: [],
    syncHash: "",
    balanceHistoryCache: {
      HOUR: {
        balances: [],
        latestDate: 1721768400000,
      },
      DAY: {
        balances: [],
        latestDate: 1721685600000,
      },
      WEEK: {
        balances: [],
        latestDate: 1721512800000,
      },
    },
    subAccounts: [],
    nfts: [],
  },
];

export const MOCKED_ARB_ACCOUNT = {
  type: "Account",
  id: "arbitrum1",
  balance: new BigNumber(34455),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: arbitrumCurrency,
  derivationMode: "",
  freshAddress: "s37rhmi7hsm3i73hsm7i3hm83m8h87hsm87h3s8h33",
};
