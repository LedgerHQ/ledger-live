import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type {
  Account,
  AccountRaw,
  CurrencyBridge,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
} from "./onboard";

export interface CantonCurrencyBridge extends CurrencyBridge {
  onboardAccount: (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: Account,
    existingAccounts: Account[],
  ) => Observable<CantonOnboardProgress | CantonOnboardResult>;
  authorizePreapproval: (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: Account,
    partyId: string,
  ) => Observable<CantonAuthorizeProgress | CantonAuthorizeResult>;
}

export type NetworkInfo = {
  family: "canton";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "canton";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "canton";
  fee: BigNumber | null | undefined;
  memo?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "canton";
  fee: string | null | undefined;
  memo?: string;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CantonResources = {
  // empty
};
export type CantonResourcesRaw = {
  // empty
};

export type CantonAccount = Account & {
  cantonResources?: CantonResources;
};
export type CantonAccountRaw = AccountRaw & {
  cantonResources: CantonResourcesRaw;
};
