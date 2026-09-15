import type { GetOsVersionResponse } from "@ledgerhq/device-management-kit";

export type OsVersionResponseOptions = {
  isBootloader?: boolean;
  isOsu?: boolean;
  isOnboarded?: boolean;
  isInRecoveryMode?: boolean;
  isSecureConnectionAllowed?: boolean;
  onboardingState?: string;
  numberOfWords?: number;
  currentWordIndex?: number;
};

/**
 * Builds a `GetOsVersionCommand` response holding only the fields the actors read. The onboarding
 * step and seed progress are set outside the catalogue type on purpose: that is how a DMK decoding
 * them delivers them.
 */
export function createOsVersionResponse({
  isBootloader = false,
  isOsu = false,
  isOnboarded = false,
  isInRecoveryMode = false,
  isSecureConnectionAllowed = false,
  ...onboardingFlags
}: OsVersionResponseOptions = {}): GetOsVersionResponse {
  return {
    isBootloader,
    isOsu,
    secureElementFlags: {
      isOnboarded,
      isInRecoveryMode,
      isSecureConnectionAllowed,
      ...onboardingFlags,
    },
  } as unknown as GetOsVersionResponse;
}
