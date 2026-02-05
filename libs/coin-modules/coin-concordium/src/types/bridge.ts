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

export type Transaction = TransactionCommon & {
  family: "concordium";
  fee: BigNumber | null | undefined;
  memo: string | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "concordium";
  fee: string | null | undefined;
  memo: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

/**
 * Concordium-specific account resources.
 * Contains onboarding status and identity information.
 *
 * Note: All fields are primitives, so this type is used for both
 * runtime (ConcordiumAccount) and serialized (ConcordiumAccountRaw) formats.
 * No separate "Raw" type needed since primitives serialize transparently.
 */
export type ConcordiumResources = {
  isOnboarded: boolean;
  credId: string;
  publicKey: string;
  identityIndex: number;
  credNumber: number;
  ipIdentity: number;
};

export type ConcordiumAccount = Account & {
  concordiumResources: ConcordiumResources;
};

export type ConcordiumAccountRaw = AccountRaw & {
  concordiumResources: ConcordiumResources;
};
