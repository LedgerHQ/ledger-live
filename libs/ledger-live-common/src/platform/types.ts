import { SignedOperation, CryptoCurrency, TokenCurrency } from "../types";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
} from "@ledgerhq/live-app-sdk";

export {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  Unit as PlatformUnit,
  Transaction as PlatformTransaction,
  CurrencyType as PlatformCurrencyType,
  TokenStandard as PlatformTokenStandard,
  CryptoCurrency as PlatformCryptoCurrency,
  ERC20TokenCurrency as PlatformERC20TokenCurrency,
} from "@ledgerhq/live-app-sdk";

export type TranslatableString = {
  en: string;
  [locale: string]: string;
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

export type AppManifest = {
  id: string;
  private?: boolean;
  name: string;
  url: string;
  homepageUrl: string;
  supportUrl?: string;
  icon?: string | null;
  platform: AppPlatform;
  apiVersion: string;
  manifestVersion: string;
  branch: AppBranch;
  params?: string[];
  categories: string[];
  currencies: string[] | "*";
  content: {
    shortDescription: TranslatableString;
    description: TranslatableString;
  };
  permissions: AppPermission[];
  domains: string[];
};

export type PlatformApi = {
  fetchManifest: () => Promise<AppManifest[]>;
};

export type PlatformSignedTransaction = SignedOperation;

export type ListPlatformAccount = (
  filters?: AccountFilters
) => PlatformAccount[];

export type ListPlatformCurrency = (
  filters?: CurrencyFilters
) => PlatformCurrency[];

export type PlatformSupportedCurrency = CryptoCurrency | TokenCurrency;
