import type {
  OnboardingBridge,
  OnboardProgress,
  OnboardResult,
} from "@ledgerhq/live-common/hooks/useAccountOnboarding";
import { map } from "rxjs/operators";
import type { CantonCurrencyBridge, CantonOnboardProgress, CantonOnboardResult } from "../types";

/**
 * Type guard to check if a bridge is a CantonCurrencyBridge
 */
export function isCantonCurrencyBridge(bridge: unknown): bridge is CantonCurrencyBridge {
  if (!bridge || typeof bridge !== "object") {
    return false;
  }

  if (!("onboardAccount" in bridge)) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const bridgeWithProperty = bridge as { onboardAccount: unknown };
  return typeof bridgeWithProperty.onboardAccount === "function";
}

/**
 * Creates an onboarding bridge adapter from a CantonCurrencyBridge
 * Maps Canton-specific types to generic onboarding types expected by the UI components
 */
export function createCantonOnboardingBridge(cantonBridge: CantonCurrencyBridge): OnboardingBridge {
  return {
    onboardAccount: (currency, deviceId, creatableAccount) => {
      return cantonBridge.onboardAccount(currency, deviceId, creatableAccount).pipe(
        map(
          (data: CantonOnboardProgress | CantonOnboardResult): OnboardProgress | OnboardResult => {
            if ("status" in data) {
              return { status: data.status };
            }
            if ("account" in data && "partyId" in data) {
              return {
                account: data.account,
                metadata: { partyId: data.partyId },
              };
            }
            throw new Error("Invalid Canton onboarding result");
          },
        ),
      );
    },
  };
}
