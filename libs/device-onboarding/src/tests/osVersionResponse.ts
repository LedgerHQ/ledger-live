import type { GetOsVersionResponse } from "@ledgerhq/device-management-kit";
import type { RecoveryKeyStatus } from "../types";

export type OsVersionResponseOptions = {
  isBootloader?: boolean;
  isOsu?: boolean;
  seVersion?: string;
  isOnboarded?: boolean;
  isInRecoveryMode?: boolean;
  isSecureConnectionAllowed?: boolean;
  onboardingState?: string;
  numberOfWords?: number;
  currentWordIndex?: number;
  recoveryKeyStatus?: RecoveryKeyStatus | null;
};

export const defaultSeVersion = "1.4.0";

/**
 * Builds a `GetOsVersionCommand` response holding only the fields the actors read. The onboarding
 * step and seed progress are set outside the catalogue type on purpose: that is how a DMK decoding
 * them delivers them.
 */
export function createOsVersionResponse({
  isBootloader = false,
  isOsu = false,
  seVersion = defaultSeVersion,
  isOnboarded = false,
  isInRecoveryMode = false,
  isSecureConnectionAllowed = false,
  recoveryKeyStatus = null,
  ...onboardingFlags
}: OsVersionResponseOptions = {}): GetOsVersionResponse {
  return {
    isBootloader,
    isOsu,
    seVersion,
    recoveryKeyStatus,
    secureElementFlags: {
      isOnboarded,
      isInRecoveryMode,
      isSecureConnectionAllowed,
      ...onboardingFlags,
    },
  } as unknown as GetOsVersionResponse;
}
