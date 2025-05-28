import { fn, Mock } from "@storybook/test";
import BigNumber from "bignumber.js";
import { bitcoinCurrency } from "./useSelectAssetFlow.mock";

export const useGetAccountIds: Mock = fn(() => []);
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
export const getAccountTuplesForCurrency: Mock = fn(() => [
  {
    account: {
      type: "Account",
      derivationMode: "native_segwit",
      freshAddress: "bc1qprvchytjcdqfqp4cxwe4gp927sd38687m2pkdr",
      creationDate: "2024-12-10T09:27:22.000Z",
      balance: new BigNumber(31918),
      currency: bitcoinCurrency,
    },
  },
]);
export const accountsSelector: Mock = fn(state => state.accounts);
export const counterValueCurrencySelector: Mock = fn(state => state.currency);
