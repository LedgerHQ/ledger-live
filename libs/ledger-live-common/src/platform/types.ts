import type { SignedOperation } from "../types";

export type {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  Unit as PlatformUnit,
  Transaction as PlatformTransaction,
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
