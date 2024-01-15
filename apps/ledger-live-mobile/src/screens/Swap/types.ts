import { Account } from "@ledgerhq/types-live";
import { ExchangeRate, MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { StackScreenProps } from "@react-navigation/stack";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";

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

export type PendingOperationParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapPendingOperation
>;

export type OperationDetailsParamList = StackScreenProps<
  SwapNavigatorParamList,
  ScreenName.SwapOperationDetails
>;

export type Target = "from" | "to";

export type DetailsSwapParamList = {
  accountId?: string;
  currency?: CryptoCurrency | TokenCurrency;
  rate?: ExchangeRate;
  transaction?: Transaction;
  target?: Target;
};

export type SwapSelectCurrency = {
  currencies: Currency[];
  provider?: string;
};

export type SwapOperation = Omit<MappedSwapOperation, "fromAccount" | "toAccount"> & {
  fromAccountId: string;
  toAccountId: string;
};

export type SwapPendingOperation = { swapOperation: SwapOperation };

export type DefaultAccountSwapParamList = {
  defaultAccount?: Account;
  defaultParentAccount?: Account;
  defaultCurrency?: CryptoCurrency | TokenCurrency;
};

export type SwapFormNavParamList = {
  SwapForm: DetailsSwapParamList | DefaultAccountSwapParamList | undefined;
  SwapHistory: undefined;
};
