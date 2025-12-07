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

export type StepProps = {
  t: TFunction;
  device: Device;
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isProcessing: boolean;
  onboardingResult: OnboardingResult | undefined;
  onboardingStatus: AccountOnboardStatus;
  error: Error | null;
  isReonboarding?: boolean;
  onAddAccounts: (accounts: Account[]) => void;
  onAddMore: () => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  transitionTo: (stepId: StepId) => void;
  onboardingConfig?: OnboardingConfig;
};

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

export type StepComponent = React.ComponentType<StepProps>;

export type FooterComponent = React.ComponentType<StepProps>;

export type TransactionConfirmComponent = React.ComponentType<{
  device: Device;
}>;

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
