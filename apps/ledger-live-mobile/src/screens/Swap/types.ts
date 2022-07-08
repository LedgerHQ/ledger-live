import {
  ExchangeRate,
  SwapDataType,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";

export type SwapFormProps = MaterialTopTabScreenProps<
  SwapFormNavParamList,
  "SwapForm"
>;

export type SelectAccountProps = StackScreenProps<
  SwapNavParamList,
  "SelectAccount"
>;

export type SelectCurrencyProps = StackScreenProps<
  SwapNavParamList,
  "SelectCurrency"
>;

export type SelectProviderProps = StackScreenProps<
  SwapNavParamList,
  "SelectProvider"
>;

export type LoginProps = StackScreenProps<SwapNavParamList, "Login">;

export type KYCProps = StackScreenProps<SwapNavParamList, "KYC">;

export type MFAProps = StackScreenProps<SwapNavParamList, "MFA">;

export type SwapNavParamList = {
  Swap: undefined;
  SelectAccount: {
    target: "from" | "to";
    accountIds: string[];
    provider: string;
    currencyIds: string[];
  };
  SelectCurrency: {
    currencies: string[];
    provider: string;
  };
  SelectProvider: {
    swap: SwapDataType;
    selectedId: string;
  };
  SelectFees: undefined;
  Login: {
    provider: string;
  };
  KYC: {
    provider: string;
  };
  MFA: {
    provider: string;
  };
};

export type SwapFormNavParamList = {
  SwapForm: {
    accountId?: string;
    currency?: CryptoCurrency | TokenCurrency;
    rate: ExchangeRate;
  };
  SwapHistory: undefined;
};
