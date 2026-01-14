import { map } from "rxjs/operators";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type {
  OnboardingBridge,
  OnboardProgress,
  OnboardResult,
} from "../../../../ledger-live-common/src/hooks/useAccountOnboarding/types";
import type {
  ConcordiumCurrencyBridge,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
} from "../types";

/**
 * Type guard to check if a bridge is a ConcordiumCurrencyBridge
 */
export function isConcordiumCurrencyBridge(bridge: unknown): bridge is ConcordiumCurrencyBridge {
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
 * Creates an onboarding bridge adapter from a ConcordiumCurrencyBridge
 * Maps Concordium-specific types to generic onboarding types expected by the UI components
 * Note: This is optional and mainly for future new architecture support
 */
export function createConcordiumOnboardingBridge(
  concordiumBridge: ConcordiumCurrencyBridge,
): OnboardingBridge {
  return {
    onboardAccount: (currency: CryptoCurrency, deviceId: string, creatableAccount: Account) => {
      return concordiumBridge.onboardAccount(currency, deviceId, creatableAccount).pipe(
        map(
          (
            data: ConcordiumOnboardProgress | ConcordiumOnboardResult,
          ): OnboardProgress | OnboardResult => {
            if ("status" in data) {
              return { status: data.status };
            }
            if ("account" in data && "accountAddress" in data) {
              return {
                account: data.account,
                metadata: {
                  accountAddress: data.accountAddress,
                  ...(data.credId && { credId: data.credId }),
                },
              };
            }
            throw new Error("Invalid Concordium onboarding result");
          },
        ),
      );
    },
  };
}
