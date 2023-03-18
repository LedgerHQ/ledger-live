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

export type AppPlatform =
  | "desktop" // == windows || mac || linux
  | "mobile" // == android || ios
  | "all";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";

export type AppPermission = {
  method: string;
  params?: any;
};

export type LiveAppManifest = {
  id: string;
  author?: string;
  private?: boolean;
  name: string;
  url: string | URL;
  params?: string[];
  homepageUrl: string;
  supportUrl?: string;
  icon?: string | null;
  platform: AppPlatform;
  apiVersion: string;
  manifestVersion: string;
  branch: AppBranch;
  permissions: AppPermission[];
  domains: string[];
  categories: string[];
  currencies: string[] | "*";
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
