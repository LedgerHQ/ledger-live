import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type {
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
    validatorId: string,
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
