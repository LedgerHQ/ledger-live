import {
  Account,
  CryptoCurrency,
  TokenAccount,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";
import { FTXProviders } from "@ledgerhq/live-common/lib/exchange/swap/utils";

export type SwapFormProps = MaterialTopTabScreenProps<
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

export type LoginProps = StackScreenProps<SwapNavParamList, "Login">;

export type KYCProps = StackScreenProps<SwapNavParamList, "KYC">;

export type SwapNavParamList = {
  Swap: undefined;
  Login: {
    provider: FTXProviders;
  };
  KYC: {
    provider: string;
  };
  SwapSelectAccount: {
    accounts: Account[];
    target: "from" | "to";
    provider: string;
  };
  SwapSelectCurrency: {
    currencies: (CryptoCurrency | TokenCurrency)[];
    provider: string;
  };
};

export type SwapFormNavParamList = {
  SwapForm: {
    account?: Account | TokenAccount;
    currency?: CryptoCurrency | TokenCurrency;
  };
  SwapHistory: undefined;
};
