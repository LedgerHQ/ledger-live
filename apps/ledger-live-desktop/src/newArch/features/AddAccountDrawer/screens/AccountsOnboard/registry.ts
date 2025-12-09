import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  cantonOnboardingConfig,
  createCantonOnboardingBridge,
  getCantonBridge,
} from "./adapters/canton";
import { OnboardingBridge, OnboardingConfig, StepId } from "./types";

/** @internal - Exported for testing purposes only */
export const onboardingConfigs: Record<string, OnboardingConfig> = {
  canton: cantonOnboardingConfig,
};

/** @internal - Exported for testing purposes only */
export const onboardingBridgeResolvers: Record<
  string,
  (currency: CryptoCurrency) => OnboardingBridge | null
> = {
  canton: (currency: CryptoCurrency) => {
    const cantonBridge = getCantonBridge(currency);
    if (!cantonBridge) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return createCantonOnboardingBridge(cantonBridge as CantonCurrencyBridge);
  },
};

export function validateOnboardingConfig(config: OnboardingConfig, family: string): void {
  const { stepFlow, stepComponents, footerComponents } = config;

  for (const stepId of stepFlow) {
    if (!stepComponents[stepId]) {
      throw new Error(
        `Invalid onboarding config for ${family}: stepFlow includes ${stepId} but stepComponents[${stepId}] is missing`,
      );
    }
    if (!footerComponents[stepId]) {
      throw new Error(
        `Invalid onboarding config for ${family}: stepFlow includes ${stepId} but footerComponents[${stepId}] is missing`,
      );
    }
  }

  if (!stepFlow.includes(StepId.ONBOARD)) {
    throw new Error(
      `Invalid onboarding config for ${family}: stepFlow must include ${StepId.ONBOARD}`,
    );
  }
  if (!stepFlow.includes(StepId.FINISH)) {
    throw new Error(
      `Invalid onboarding config for ${family}: stepFlow must include ${StepId.FINISH}`,
    );
  }
}

for (const [family, config] of Object.entries(onboardingConfigs)) {
  validateOnboardingConfig(config, family);
}

export function getOnboardingConfig(currency: CryptoCurrency): OnboardingConfig | null {
  const config = onboardingConfigs[currency.family];
  return config ?? null;
}

export function hasOnboarding(currency: CryptoCurrency): boolean {
  return currency.family in onboardingConfigs;
}

export function hasCreatableAccounts(accounts: { used?: boolean }[]): boolean {
  return accounts.some(account => !account.used);
}

export function getOnboardingBridge(currency: CryptoCurrency): OnboardingBridge | null {
  const resolver = onboardingBridgeResolvers[currency.family];
  if (!resolver) {
    return null;
  }
  return resolver(currency);
}
