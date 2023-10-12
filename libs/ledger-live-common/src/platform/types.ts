import type { SignedOperation } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  FAMILIES,
} from "@ledgerhq/live-app-sdk";

/**
 * this is a hack to add the "evm" family to the list of supported families of
 * the deprecated @ledgerhq/live-app-sdk, still used by some live apps.
 * Since "evm" will be (is) the new family of original currencies under the
 * "ethereum" family, following the "ethereum" / "evm" families merge
 * (and removal of the "ethereum" family)
 */
export const PLATFORM_FAMILIES = [...Object.values(FAMILIES), "evm"];

export type {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  Unit as PlatformUnit,
  Transaction as PlatformTransaction,
  CryptoCurrency as PlatformCryptoCurrency,
  ERC20TokenCurrency as PlatformERC20TokenCurrency,
} from "@ledgerhq/live-app-sdk";

export {
  CurrencyType as PlatformCurrencyType,
  TokenStandard as PlatformTokenStandard,
} from "@ledgerhq/live-app-sdk";

export type TranslatableString = {
  en: string;
  [locale: string]: string;
};

export type Loadable<T> = {
  error: any | null;
  isLoading: boolean;
  value: T | null;
};

export type AppPlatform = "ios" | "android" | "desktop";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";
export type Visibility = "complete" | "searchable" | "deep";

export type ParamsWithDappUrl = {
  dappUrl: string;
};

export type ParamsWithNetwork = {
  networks: Array<LiveAppManifestParamsNetwork>;
};

export type LiveAppManifestParamsDappWithNetwork = ParamsWithDappUrl & ParamsWithNetwork;
export type LiveAppManifestParamsDappWithNetworkAndNanoApp =
  LiveAppManifestParamsDappWithNetwork & {
    nanoApp: string;
    dappName: string;
  };

export type LiveAppManifestParamsDapp =
  | LiveAppManifestParamsDappWithNetwork
  | LiveAppManifestParamsDappWithNetworkAndNanoApp;

export type LiveAppManifestParamsWebApp = {
  currencies: string[];
  webAppName: string;
  webUrl: string;
};

export type LiveAppManifestParams =
  | LiveAppManifestParamsDapp
  | LiveAppManifestParamsWebApp
  | ParamsWithNetwork
  | Array<string>;

export type LiveAppManifestParamsNetwork = {
  currency: string;
  chainID: number;
  nodeURL?: string;
};

export type LiveAppManifest = {
  id: string;
  author?: string;
  private?: boolean;
  name: string;
  url: string | URL;
  params?: LiveAppManifestParams;
  homepageUrl: string;
  supportUrl?: string;
  icon?: string | null;
  platforms: AppPlatform[];
  apiVersion: string;
  manifestVersion: string;
  branch: AppBranch;
  permissions: string[];
  domains: string[];
  categories: string[];
  currencies: string[] | "*";
  visibility: Visibility;
  content: {
    shortDescription: TranslatableString;
    description: TranslatableString;
  };
};

export type PlatformApi = {
  fetchManifest: () => Promise<LiveAppManifest[]>;
};

export type PlatformSignedTransaction = SignedOperation;

export type ListPlatformAccount = (filters?: AccountFilters) => PlatformAccount[];

export type ListPlatformCurrency = (filters?: CurrencyFilters) => PlatformCurrency[];

export type PlatformSupportedCurrency = CryptoCurrency | TokenCurrency;
