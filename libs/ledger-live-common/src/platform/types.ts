import type { SignedOperation } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  FAMILIES,
} from "@ledgerhq/live-app-sdk";

export const PLATFORM_FAMILIES = Object.values(FAMILIES);

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

export type AppPermission = {
  method: string;
  params?: any;
};

export type LiveAppManifestParams =
  | {
      dappName: string;
      dappUrl: string;
      nanoApp: string;
      networks: Array<LiveAppManifestParamsNetwork>;
    }
  | {
      currencies: string[];
      webAppName: string;
      webUrl: string;
    }
  | {
      dappUrl: string;
      networks: Array<LiveAppManifestParamsNetwork>;
    }
  | {
      networks: Array<LiveAppManifestParamsNetwork>;
    }
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
  permissions: AppPermission[];
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

export type ListPlatformAccount = (
  filters?: AccountFilters
) => PlatformAccount[];

export type ListPlatformCurrency = (
  filters?: CurrencyFilters
) => PlatformCurrency[];

export type PlatformSupportedCurrency = CryptoCurrency | TokenCurrency;
