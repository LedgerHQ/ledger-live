import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  cantonOnboardingConfig,
  createCantonOnboardingBridge,
  getCantonBridge,
} from "./adapters/canton";
import { OnboardingBridge, OnboardingConfig, StepId } from "./types";

/**
 * Registry of onboarding configurations by currency family
 */
export const onboardingConfigs: Record<string, OnboardingConfig> = {
  canton: cantonOnboardingConfig,
};

/**
 * Registry of onboarding bridge factories by currency family
 */
export const onboardingBridgeFactories: Record<
  string,
  (currency: CryptoCurrency) => OnboardingBridge | null
> = {
  canton: (currency: CryptoCurrency) => {
    const cantonBridge = getCantonBridge(currency);
    if (!cantonBridge) {
      return null;
    }
    return createCantonOnboardingBridge(cantonBridge);
  },
};

/**
 * Validates that an onboarding config has all required components
 */
export function validateOnboardingConfig(config: OnboardingConfig, family: string): void {
  const { stepFlow, stepComponents, footerComponents } = config;

  // Validate all steps in flow have components
  for (const stepId of stepFlow) {
    if (!stepComponents[stepId]) {
      throw new Error(`Invalid onboarding config for ${family}: stepComponents[${stepId}] missing`);
    }
    if (!footerComponents[stepId]) {
      throw new Error(
        `Invalid onboarding config for ${family}: footerComponents[${stepId}] missing`,
      );
    }
  }

  // Validate required steps
  if (!stepFlow.includes(StepId.ONBOARD)) {
    throw new Error(`Invalid onboarding config for ${family}: must include ${StepId.ONBOARD}`);
  }
  if (!stepFlow.includes(StepId.FINISH)) {
    throw new Error(`Invalid onboarding config for ${family}: must include ${StepId.FINISH}`);
  }
}

// Validate all registered configs at module load time
for (const [family, config] of Object.entries(onboardingConfigs)) {
  validateOnboardingConfig(config, family);
}

/**
 * Gets the onboarding configuration for a currency
 */
export function getOnboardingConfig(currency: CryptoCurrency): OnboardingConfig | null {
  return onboardingConfigs[currency.family] ?? null;
}

/**
 * Checks if a currency supports onboarding
 */
export function hasOnboarding(currency: CryptoCurrency): boolean {
  return currency.family in onboardingConfigs;
}

/**
 * Gets the onboarding bridge for a currency
 */
export function getOnboardingBridge(currency: CryptoCurrency): OnboardingBridge | null {
  const factory = onboardingBridgeFactories[currency.family];
  if (!factory) {
    return null;
  }
  return factory(currency);
}
