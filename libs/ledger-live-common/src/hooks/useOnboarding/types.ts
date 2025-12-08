import type { DeviceModelId } from "@ledgerhq/devices";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

export { AccountOnboardStatus };

export enum StepId {
  ONBOARD = "ONBOARD",
  FINISH = "FINISH",
}

/**
 * Normalized device information for onboarding.
 * Contains only the fields needed for onboarding operations.
 */
export type OnboardingDeviceInfo = {
  deviceId: string;
  modelId: DeviceModelId;
};

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

/**
 * Shared props that remain stable throughout the onboarding flow.
 * These props don't change during onboarding operations.
 */
export type StableStepProps = {
  currency: CryptoCurrency;
  device: OnboardingDeviceInfo;
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

/**
 * Shared props that change dynamically during onboarding operations.
 * These props reflect the current state of the onboarding process.
 */
export type DynamicStepProps = {
  isProcessing: boolean;
  onboardingStatus: AccountOnboardStatus;
  onboardingResult: OnboardingResult | undefined;
  error: Error | null;
};
