import type { SignedOperation } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as WalletAPIAccount,
  Currency as WalletAPICurrency,
} from "@ledgerhq/wallet-api-core";

export type {
  Families as WalletAPIFamilies,
  Account as WalletAPIAccount,
  Currency as WalletAPICurrency,
  Transaction as WalletAPITransaction,
  CryptoCurrency as WalletAPICryptoCurrency,
  ERC20TokenCurrency as WalletAPIERC20TokenCurrency,
} from "@ledgerhq/wallet-api-core";

export {
  CurrencyType as WalletAPICurrencyType,
  TokenStandard as WalletAPITokenStandard,
} from "@ledgerhq/wallet-api-core";

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
  url: string | URL;
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

export type WalletAPISignedTransaction = SignedOperation;

export type ListWalletAPIAccount = (
  filters?: AccountFilters
) => WalletAPIAccount[];

export type ListWalletAPICurrency = (
  filters?: CurrencyFilters
) => WalletAPICurrency[];

export type WalletAPISupportedCurrency = CryptoCurrency | TokenCurrency;
