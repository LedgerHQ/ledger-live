import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { fn, Mock } from "@storybook/test";
import BigNumber from "bignumber.js";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  hederaCurrency,
  scrollCurrency,
} from "./useSelectAssetFlow.mock";

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
export const useCountervaluesState: Mock = fn(() => ({ cache: { "USD arbitrum": "" } }));
export const accountsSelector: Mock = fn(state => state.accounts);
export const counterValueCurrencySelector: Mock = fn(state => state.currency);
export const discreetModeSelector: Mock = fn(state => state.discreet);
export const localeSelector: Mock = fn(state => state.locale);

export const MOCKED_ARB_ACCOUNT = {
  type: "Account",
  id: "arbitrum1",
  balance: new BigNumber(34455),
  creationDate: "2024-12-10T09:27:22.000Z",
  currency: arbitrumCurrency,
  derivationMode: "",
  freshAddress: "s37rhmi7hsm3i73hsm7i3hm83m8h87hsm87h3s8h33",
};

export const ETH_ACCOUNT = genAccount("ethereum-1", {
  currency: ethereumCurrency,
});
export const ETH_ACCOUNT_2 = genAccount("ethereum-2", {
  currency: ethereumCurrency,
});
export const BTC_ACCOUNT = genAccount("bitcoin-1", {
  currency: bitcoinCurrency,
});
export const ARB_ACCOUNT = genAccount("arbitrum-1", {
  currency: arbitrumCurrency,
  tokenIds: ["arbitrum/erc20/arbitrum"],
});
export const ETH_ACCOUNT_WITH_USDC = genAccount("ethereum-usdc", {
  currency: ethereumCurrency,
  tokenIds: ["ethereum/erc20/usdc"],
});
export const BASE_ACCOUNT = genAccount("base-1", {
  currency: baseCurrency,
  operationsSize: 100,
});
export const SCROLL_ACCOUNT = genAccount("scroll-1", {
  currency: scrollCurrency,
  operationsSize: 100,
});
export const HEDERA_ACCOUNT = genAccount("hedera-1", {
  currency: hederaCurrency,
  operationsSize: 100,
});

export const useCountervaluesPolling = () => ({
  wipe: () => {},
  poll: () => {},
  start: () => {},
  stop: () => {},
  pending: false,
  error: null,
});

export const useCountervaluesUserSettings = () => ({ trackingPairs: [] });

export const userThemeSelector = () => "light";

export const blacklistedTokenIdsSelector = () => {};

export const getLLDCoinFamily = () => ({});
export const isAccountEmpty = () => false;
export const languageSelector = () => ({});
export const openURL = () => {};
export const useCalculate = () => 100;
