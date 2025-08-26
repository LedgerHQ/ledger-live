import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export type ProviderBalanceAsset = {
  id: string;
  name: string;
  ticker: string;
  balance: string;
  fiatValue: string;
  sortValue: number;
};

export type ProviderBalanceResultsMap = Map<string, ProviderBalanceAsset>;

export type AssetWithBalance = AssetType & {
  sortValue?: number;
};

export type UseBalanceDeps = () => {
  flattenedAccounts: AccountLike[];
  discreet: boolean;
  state: CounterValuesState;
  counterValueCurrency: Currency;
  locale: string;
};

export type BalanceUI = { balance?: string; fiatValue?: string };
export type CreateBalanceItem = (x: BalanceUI) => React.ReactNode;
