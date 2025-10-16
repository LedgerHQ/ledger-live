import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { CryptoOrTokenCurrency, Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { ReactNode } from "react";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "../../wallet-api/types";
import { EnhancedModularDrawerConfiguration } from "../../wallet-api/ModularDrawer/types";
import { InterestRate } from "../../dada-client/entities";
import { MarketItemResponse } from "../../market/utils/types";
import BigNumber from "bignumber.js";
import { ApyType } from "../../dada-client/types/trend";

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
  state: CounterValuesState;
  counterValueCurrency: Currency;
  locale: string;
};

export type BalanceUI = {
  // Raw values
  balance: BigNumber;
  fiatValue?: number;
  fiatUnit?: Unit;
  currency: CryptoOrTokenCurrency;
  // Formatting parameters
  locale?: string;
  discreet?: boolean;
};
export type CreateBalanceItem = (x: BalanceUI) => React.ReactNode;

export type CreateAccountsCountAndApy = (args: {
  label?: string;
  value?: number;
  type?: ApyType;
}) => ReactNode;

export type NetworkWithCount = {
  leftElement?: ReactNode;
  count: number;
};

export type AccountDataItem = {
  asset: CryptoOrTokenCurrency;
  label: string;
  count: number;
};

export type AccountModuleParams = {
  networks: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export type CreateAccountsCount = (args: { label: string }) => ReactNode;

export type UseAccountData = (params: AccountModuleParams) => AccountDataItem[];

export type NetworkHookParams = {
  networks: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};
// Network hook type that returns additional properties to be merged with currencies
export type NetworkHook = (params: NetworkHookParams) => Array<{
  balanceData?: BalanceUI;
  count?: number;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}>;

export type NetworkConfigurationDeps = {
  useAccountData: UseAccountData;
  accountsCount: CreateAccountsCount;
  accountsCountAndApy: CreateAccountsCountAndApy;
  useBalanceDeps: UseBalanceDeps;
  balanceItem: CreateBalanceItem;
};

export type NetworkLeftElementKind = "numberOfAccounts" | "numberOfAccountsAndApy" | "undefined";
export type NetworkRightElementKind = "balance" | "undefined";

export type Network = {
  name: string;
  id: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export type CreateNetworkConfigurationHookProps = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  accounts$?: Observable<WalletAPIAccount[]>;
};

type Props = {
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
};

export type AssetConfigurationDeps = {
  ApyIndicator: (args: { value: number; type: ApyType }) => ReactNode;
  MarketPercentIndicator: (args: { percent: number }) => ReactNode;
  MarketPriceIndicator: (args: { price: string; percent: number }) => ReactNode;
  useBalanceDeps: UseBalanceDeps;
  balanceItem: CreateBalanceItem;
  assetsMap: Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >;
};

export type CreateAssetConfigurationHook = (
  AssetConfigurationDeps: AssetConfigurationDeps,
) => (props: Props) => (assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & AssetType)[];

export type AssetData = {
  asset: {
    id: string;
    ticker: string;
    name: string;
    assetsIds: Record<string, string>;
    metaCurrencyId?: string;
  };
  networks: CryptoOrTokenCurrency[];
  interestRates?: InterestRate;
  market?: Partial<MarketItemResponse>;
};
