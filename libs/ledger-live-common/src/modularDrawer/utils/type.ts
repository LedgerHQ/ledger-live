import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { ReactNode } from "react";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "../../wallet-api/types";
import { CurrenciesByProviderId } from "../../deposit/type";
import { EnhancedModularDrawerConfiguration } from "../../wallet-api/ModularDrawer/types";

export type ApyType = "NRR" | "APY" | "APR";

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

export type CreateAccountsCountAndApy = (args: {
  label?: string;
  value?: number;
  type?: ApyType;
}) => ReactNode;

export type NetworkWithCount = CryptoOrTokenCurrency & {
  leftElement?: ReactNode;
  count: number;
};

export type AccountDataItem = {
  asset: CryptoOrTokenCurrency;
  label: string;
  count: number;
};

export type AccountModuleParams = {
  assets: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export type CreateAccountsCount = (args: { label: string }) => ReactNode;

export type UseAccountData = (params: AccountModuleParams) => AccountDataItem[];

export type NetworkHookParams = {
  assets: CryptoOrTokenCurrency[];
  networks: CryptoOrTokenCurrency[];
  selectedAssetId: string;
  currenciesByProvider: CurrenciesByProviderId[];
  accounts$?: Observable<WalletAPIAccount[]>;
};
export type NetworkHook = (params: NetworkHookParams) => Array<CryptoOrTokenCurrency & Network>;

export type NetworkConfigurationDeps = {
  useAccountData: UseAccountData;
  accountsCount: CreateAccountsCount;
  accountsCountAndApy: CreateAccountsCountAndApy;
  useBalanceDeps: UseBalanceDeps;
  balanceItem: CreateBalanceItem;
};

export type LeftElementKind = "numberOfAccounts" | "numberOfAccountsAndApy" | "undefined";
export type RightElementKind = "balance" | "undefined";

export type Network = {
  name: string;
  id: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export type CreateNetworkConfigurationHookProps = {
  networksConfig: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider?: CurrenciesByProviderId[];
  selectedAssetId: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

type Props = {
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  currenciesByProvider?: CurrenciesByProviderId[];
};

export type AssetConfigurationDeps = {
  ApyIndicator: (args: { value: number; type: ApyType }) => ReactNode;
  useBalanceDeps: UseBalanceDeps;
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
};

export type CreateAssetConfigurationHook = (
  AssetConfigurationDeps: AssetConfigurationDeps,
) => (props: Props) => (assets: CryptoOrTokenCurrency[]) => (CryptoOrTokenCurrency & AssetType)[];
