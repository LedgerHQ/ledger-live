import {
  AccountOnboardStatus,
  BaseStableStepProps,
  DynamicStepProps as SharedDynamicStepProps,
  OnboardingConfig as BaseOnboardingConfig,
  OnboardingResult,
  OnboardProgress,
  OnboardResult,
  OnboardingBridge,
  StepId,
} from "@ledgerhq/live-common/hooks/useOnboarding/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TFunction } from "i18next";
import React from "react";

export { AccountOnboardStatus, StepId };
export type { OnboardProgress, OnboardResult, OnboardingBridge, OnboardingResult };

export type StableStepProps = BaseStableStepProps & {
  t: TFunction;
  device: Device;
  onboardingConfig?: OnboardingConfig;
};

export type DynamicStepProps = SharedDynamicStepProps;

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

export interface OnboardingConfig extends BaseOnboardingConfig {
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
  transactionConfirmComponent?: TransactionConfirmComponent;
}
