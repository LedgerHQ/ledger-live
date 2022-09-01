import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "../../const";

export type SwapFormProps = MaterialTopTabScreenProps<
  SwapFormNavParamList,
  ScreenName.SwapForm
>;

export type SelectAccountProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectAccount
>;

export type SelectCurrencyProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectCurrency
>;

export type SelectProviderProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectProvider
>;

export type SelectFeesProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapSelectFees
>;

export type LoginProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapLogin
>;

export type KYCProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapKYC
>;

export type MFAProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapMFA
>;

export type PendingOperationProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapPendingOperation
>;

export type OperationDetailsProps = StackScreenProps<
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
