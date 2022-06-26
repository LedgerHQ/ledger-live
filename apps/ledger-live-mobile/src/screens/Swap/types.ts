import {
  Account,
  CryptoCurrency,
  TokenAccount,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";

export type SwapProps = MaterialTopTabScreenProps<
  SwapFormNavParamList,
  "SwapForm"
>;

export type SelectAccountProps = StackScreenProps<
  SwapNavParamList,
  "SwapSelectAccount"
>;

export type SelectCurrencyProps = StackScreenProps<
  SwapNavParamList,
  "SwapSelectCurrency"
>;

export type SwapNavParamList = {
  Swap: {
    account?: Account | TokenAccount;
    currency?: CryptoCurrency | TokenCurrency;
  };
  SwapSelectAccount: {
    target: "from" | "to";
  };
  SwapSelectCurrency: undefined;
};

export type SwapFormNavParamList = {
  SwapForm: undefined;
  SwapHistory: undefined;
};
