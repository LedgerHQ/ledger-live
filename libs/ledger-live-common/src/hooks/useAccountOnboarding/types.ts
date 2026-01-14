import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

export { AccountOnboardStatus };

export enum StepId {
  ONBOARD = "ONBOARD",
  FINISH = "FINISH",
}

export type OnboardProgress = {
  status: AccountOnboardStatus;
};

export type OnboardResult = {
  account: Account;
  metadata?: Record<string, unknown>;
};

export interface OnboardingBridge {
  onboardAccount: (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: Account,
  ) => Observable<OnboardProgress | OnboardResult>;
}

export type OnboardingResult = {
  completedAccount: Account;
  metadata?: Record<string, unknown>;
};

export interface OnboardingConfig {
  stepFlow: StepId[];
}

export type BaseStableStepProps = {
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isReonboarding?: boolean;
  onAddAccounts: (accounts: Account[]) => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  transitionTo: (stepId: StepId) => void;
};

export type DynamicStepProps = {
  isProcessing: boolean;
  onboardingStatus: AccountOnboardStatus;
  onboardingResult: OnboardingResult | undefined;
  error: Error | null;
};
