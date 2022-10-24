import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "../../const";
import { BaseComposite } from "../../components/RootNavigator/types/helpers";

export type SwapFormParamList = MaterialTopTabScreenProps<
  SwapFormNavParamList,
  ScreenName.SwapForm
>;

export type SelectAccountParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectAccount
>;

export type SelectCurrencyParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectCurrency
>;

export type SelectProviderParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectProvider
>;

export type SelectFeesParamList = BaseComposite<
  StackScreenProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

export type LoginParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapLogin
>;

export type KYCParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapKYC
>;

export type MFAParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapMFA
>;

export type PendingOperationParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapPendingOperation
>;

export type OperationDetailsParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapOperationDetails
>;

export type Target = "from" | "to";

export type SwapFormNavParamList = {
  SwapForm:
    | {
        accountId?: string;
        currency?: CryptoCurrency | TokenCurrency;
        rate?: ExchangeRate;
        transaction?: Transaction;
        target?: Target;
      }
    | undefined;
  SwapHistory: undefined;
};
