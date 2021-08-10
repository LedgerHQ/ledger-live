import type { BigNumber } from "bignumber.js";
import type { SignedOperation } from "../types";

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

export type PlatformAccount = {
  id: string;
  name: string;
  address: string;
  currency: string;
  balance: BigNumber;
  spendableBalance: BigNumber;
  blockHeight: number;
  lastSyncDate: Date;
};
export type PlatformUnit = {
  name: string;
  code: string;
  magnitude: number;
};
export type PlatformCurrency = {
  type: string;
  color: string;
  ticker: string;
  id: string;
  name: string;
  family: string;
  units: PlatformUnit[];
};
export interface PlatformTransactionCommon {
  amount: BigNumber;
  recipient: string;
}
export interface PlatformEthereumTransaction extends PlatformTransactionCommon {
  family: "ethereum";
  nonce: number | null | undefined;
  data: Buffer | null | undefined;
  gasPrice: BigNumber | null | undefined;
  gasLimit: BigNumber | null | undefined;
}
export interface PlatformBitcoinTransaction extends PlatformTransactionCommon {
  family: "bitcoin";
  feePerByte: BigNumber | null | undefined;
}
export type PlatformTransaction =
  | PlatformEthereumTransaction
  | PlatformBitcoinTransaction;
export type PlatformSignedTransaction = SignedOperation;
