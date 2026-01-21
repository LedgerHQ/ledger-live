import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountRaw,
  CurrencyBridge,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type {
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
} from "./onboard";

export interface ConcordiumCurrencyBridge extends CurrencyBridge {
  pairWalletConnect: (
    currency: CryptoCurrency,
    deviceId: string,
  ) => Observable<ConcordiumPairingProgress>;
  onboardAccount: (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: Account,
  ) => Observable<ConcordiumOnboardProgress | ConcordiumOnboardResult>;
}

export type NetworkInfo = {
  family: "concordium";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "concordium";
  serverFee: string;
  baseReserve: string;
};

export type Transaction = TransactionCommon & {
  family: "concordium";
  fee: BigNumber | null | undefined;
  memo?: string | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "concordium";
  fee: string | null | undefined;
  memo?: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type ConcordiumResources = {
  isOnboarded: boolean;
  credId: string;
  publicKey: string;
  // Fields for verify address (both legacy and new protocols)
  identityIndex: number;
  credNumber: number;
  ipIdentity: number;
};

export type ConcordiumResourcesRaw = {
  isOnboarded: boolean;
  credId: string;
  publicKey: string;
  // Fields for verify address (both legacy and new protocols)
  identityIndex: number;
  credNumber: number;
  ipIdentity: number;
};

export type ConcordiumAccount = Account & {
  concordiumResources: ConcordiumResources;
};

export type ConcordiumAccountRaw = AccountRaw & {
  concordiumResources: ConcordiumResourcesRaw;
};

export type ConcordiumTransaction = {
  TransactionType: "Payment";
  Account: string;
  Amount: string;
  Destination: string;
  Fee: string;
  Sequence: number;
  SigningPubKey?: string;
  TxnSignature?: string;
};
