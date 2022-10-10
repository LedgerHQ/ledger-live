import type { SignedOperation } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
} from "@ledgerhq/live-app-sdk";
import { string } from "superstruct";

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

export type AppPlatform =
  | "desktop" // == windows || mac || linux
  | "mobile" // == android || ios
  | "all";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";

export type AppPermission = {
  method: string;
  params?: any;
};

type dAppParamsNetwork = {
  currency: string;
  chainId: number;
  nodeURL: string;
};
type dAppParams = {
  dappUrl: string;
  nanoApp: string;
  dappName: string;
  networks: Array<dAppParamsNetwork>;
};
export function isDAppParams(params: any): params is dAppParams {
  return (params as dAppParams).dappUrl !== undefined;
}
type webAppParams = {
  webUrl: string;
  webAppName: string;
  currencies: Array<string>;
};
export function isWebAppParams(params: any): params is webAppParams {
  return (params as webAppParams).webUrl !== undefined;
}
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
  params?: dAppParams | webAppParams | any;
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
