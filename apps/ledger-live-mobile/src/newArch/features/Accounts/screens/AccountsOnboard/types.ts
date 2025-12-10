import {
  AccountOnboardStatus,
  BaseStableStepProps,
  DynamicStepProps as SharedDynamicStepProps,
  OnboardingConfig as BaseConfig,
  OnboardProgress,
  OnboardResult,
  OnboardingBridge,
  OnboardingResult,
  StepId,
} from "@ledgerhq/live-common/hooks/useAccountOnboarding";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import type { NavigationSnapshot } from "~/families/canton/utils/navigationSnapshot";

export { AccountOnboardStatus, StepId };
export type { OnboardProgress, OnboardResult, OnboardingBridge, OnboardingResult };

export type StepComponent = React.ComponentType<StableStepProps & DynamicStepProps>;
export type FooterComponent = React.ComponentType<StableStepProps & DynamicStepProps>;

export type StableStepProps = BaseStableStepProps & {
  device: { deviceId: string };
  onboardingConfig?: OnboardingConfig;
};

export type DynamicStepProps = SharedDynamicStepProps;

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

export interface OnboardingConfig extends BaseConfig {
  stepFlow: StepId[];
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
}

export type AccountsOnboardParams = {
  accountsToAdd: Account[];
  currency: CryptoCurrency;
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  restoreState?: NavigationSnapshot;
  editedNames?: { [accountId: string]: string };
};
