import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import React from "react";
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

export type StableStepProps = {
  t: TFunction;
  device: Device;
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isReonboarding?: boolean;
  onboardingConfig?: OnboardingConfig;
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

export type StepProps = StableStepProps & DynamicStepProps;

export type TranslationKeys = {
  title: string;
  reonboardTitle: string;
  init: string;
  reonboardInit: string;
  success: string;
  reonboardSuccess: string;
  error: string;
  error429?: string;
  onboarded?: string;
  existingAccounts?: string;
  account?: string;
  newAccount?: string;
  statusPrepare?: string;
  statusSubmit?: string;
  statusDefault?: string;
  [key: string]: string | undefined;
};

export type UrlConfig = {
  learnMore?: string;
  [key: string]: string | undefined;
};

export type StepComponent = React.ComponentType<StableStepProps & DynamicStepProps>;

export type FooterComponent = React.ComponentType<StableStepProps & DynamicStepProps>;

export type TransactionConfirmComponent = React.ComponentType<{ device: Device }>;

export interface OnboardingConfig {
  stepComponents: {
    [StepId.ONBOARD]: StepComponent;
    [StepId.FINISH]: StepComponent;
  };
  footerComponents: {
    [StepId.ONBOARD]: FooterComponent;
    [StepId.FINISH]: FooterComponent;
  };
  translationKeys: TranslationKeys;
  urls: UrlConfig;
  stepFlow: StepId[];
  transactionConfirmComponent?: TransactionConfirmComponent;
}
