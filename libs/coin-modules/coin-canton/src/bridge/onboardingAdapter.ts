import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type {
  CantonAccount,
  CantonCurrencyBridge,
  CantonOnboardProgress,
  CantonOnboardResult,
} from "../types";

// Types for the generic onboarding bridge interface
export type OnboardProgress = {
  status: string;
};

export type OnboardResult = {
  account: CantonAccount;
  metadata: {
    partyId: string;
  };
};

export type OnboardingBridge = {
  onboardAccount: (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: CantonAccount,
  ) => Observable<OnboardProgress | OnboardResult>;
};

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
                account: data.account as CantonAccount,
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
