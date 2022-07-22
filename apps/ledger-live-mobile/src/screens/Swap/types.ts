import {
  ExchangeRate,
  MappedSwapOperation,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  AccountLike,
  CryptoCurrency,
  Operation,
  TokenCurrency,
  Transaction,
} from "@ledgerhq/live-common/types/index";
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

export type SelectFeesProps = StackScreenProps<SwapNavParamList, "SelectFees">;

export type LoginProps = StackScreenProps<SwapNavParamList, "Login">;

export type KYCProps = StackScreenProps<SwapNavParamList, "KYC">;

export type MFAProps = StackScreenProps<SwapNavParamList, "MFA">;

export type PendingOperationProps = StackScreenProps<
  SwapNavParamList,
  "PendingOperation"
>;

export type OperationDetailsProps = StackScreenProps<
  SwapNavParamList,
  "OperationDetails"
>;

export type SwapNavParamList = {
  Swap: undefined;
  SelectAccount: {
    target: "from" | "to";
    accounts: AccountLike & { disabled: boolean };
    provider: string;
    currencyIds: string[];
  };
  SelectCurrency: {
    currencies: string[];
    provider: string;
  };
  SelectProvider: {
    provider: string;
    swap: SwapDataType;
    selectedId: string;
  };
  SelectFees: {
    swap: SwapDataType;
    rate: ExchangeRate;
    provider: string;
    transaction: Transaction;
  };
  Login: {
    provider: string;
  };
  KYC: {
    provider: string;
  };
  MFA: {
    provider: string;
  };
  PendingOperation: {
    swapOperation: MappedSwapOperation;
  };
  OperationDetails: {
    swapOperation: MappedSwapOperation;
  };
};

export type SwapFormNavParamList = {
  SwapForm: {
    accountId?: string;
    currency?: CryptoCurrency | TokenCurrency;
    rate?: ExchangeRate;
    transaction?: Transaction;
  };
  SwapHistory: undefined;
};
