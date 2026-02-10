import type { ExchangeRate, MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike, SwapOperation } from "@ledgerhq/types-live";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import type { SwapWebviewAllowedPageNames } from "~/components/Web3AppWebview/types";
import type { ScreenName } from "~/const";

export type PendingOperationParamList = NativeStackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapPendingOperation
>;

export type OperationDetailsParamList = NativeStackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapOperationDetails
>;
export type SwapCustomErrorProps = NativeStackScreenProps<
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
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  defaultCurrency?: CryptoCurrency | TokenCurrency;
  affiliate?: string;
  fromPath?: string;
  toTokenId?: string;
}

export type SwapLiveAppNavigationParams = {
  swapNavigationParams?: {
    tab?: "ACCOUNTS_SELECTION" | "QUOTES_LIST" | null;
    page?: SwapWebviewAllowedPageNames;
    canGoBack?: boolean;
    isTransactionComplete?: boolean;
  };
};
