import type { ExchangeRate, MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, SwapOperation } from "@ledgerhq/types-live";
import type { StackScreenProps } from "@react-navigation/stack";
import type { BaseComposite } from "~/components/RootNavigator/types/helpers";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import type { SwapWebviewAllowedPageNames } from "~/components/Web3AppWebview/types";
import type { ScreenName } from "~/const";

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

export type PendingOperationParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapPendingOperation
>;

export type OperationDetailsParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapOperationDetails
>;
export type SwapCustomErrorProps = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapCustomError
>;

export type Target = "from" | "to";

export interface DetailsSwapParamList extends SwapLiveAppNavigationParams {
  accountId?: string;
  currency?: CryptoCurrency | TokenCurrency;
  rate?: ExchangeRate;
  transaction?: Transaction;
  target?: Target;
}

export type SwapSelectCurrency = {
  currencies: Currency[];
  provider?: string;
};

export type SwapOperationDetails = Omit<MappedSwapOperation, "fromAccount" | "toAccount"> & {
  fromAccountId: string;
  toAccountId: string;
};

export type SwapPendingOperation = { swapOperation: SwapOperation };

export interface DefaultAccountSwapParamList extends SwapLiveAppNavigationParams {
  defaultAccount?: Account;
  defaultParentAccount?: Account;
  defaultCurrency?: CryptoCurrency | TokenCurrency;
  affiliate?: string;
}

export type SwapFormNavParamList = {
  SwapForm: DetailsSwapParamList | DefaultAccountSwapParamList | undefined;
  SwapHistory: undefined;
  SwapPendingOperation: undefined;
};

export type SwapLiveAppNavigationParams = {
  swapNavigationParams?: {
    tab?: "ACCOUNTS_SELECTION" | "QUOTES_LIST" | null;
    page?: SwapWebviewAllowedPageNames;
    canGoBack?: boolean;
  };
};
