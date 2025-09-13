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
import type {
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
} from "./onboard";

export interface CantonCurrencyBridge extends CurrencyBridge {
  onboardAccount: (
    deviceId: string,
    derivationPath: string,
  ) => Observable<CantonOnboardProgress | CantonOnboardResult>;
  authorizePreapproval: (
    deviceId: string,
    derivationPath: string,
    partyId: string,
  ) => Observable<CantonPreApprovalProgress | CantonPreApprovalResult>;
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
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "canton";
  fee: string | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CantonResources = {
  partyId: string;
};
export type CantonResourcesRaw = {
  partyId: string;
};

export type CantonAccount = Account & {
  cantonResources?: CantonResources;
};
export type CantonAccountRaw = AccountRaw & {
  cantonResources: CantonResourcesRaw;
};
