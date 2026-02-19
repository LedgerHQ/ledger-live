import {
  AccountOnboardStatus,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
} from "@ledgerhq/coin-concordium/types";

export const MAX_EXPIRED_RETRIES = 3;
export const CONFIRMATION_CODE_LENGTH = 4;

export function getConfirmationCode(sessionTopic: string): string {
  if (sessionTopic.length < CONFIRMATION_CODE_LENGTH) {
    throw new Error(
      `Invalid sessionTopic: expected at least ${CONFIRMATION_CODE_LENGTH} characters, got ${sessionTopic.length}`,
    );
  }
  return sessionTopic.substring(0, CONFIRMATION_CODE_LENGTH).toUpperCase();
}

export function shouldRetryPairing(error: unknown, retryCount: number): boolean {
  if (retryCount >= MAX_EXPIRED_RETRIES) {
    return false;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  return errorMessage.toLowerCase().includes("expired");
}

export type PairingStateUpdate = {
  onboardingStatus: AccountOnboardStatus;
  walletConnectUri?: string | null;
  sessionTopic?: string | null;
  isPairing?: boolean;
};

export function handlePairingProgress(data: ConcordiumPairingProgress): PairingStateUpdate | null {
  switch (data.status) {
    case ConcordiumPairingStatus.PREPARE:
      if ("walletConnectUri" in data && data.walletConnectUri) {
        return {
          onboardingStatus: AccountOnboardStatus.PREPARE,
          walletConnectUri: data.walletConnectUri,
        };
      }
      return null;

    case ConcordiumPairingStatus.SUCCESS:
      if ("sessionTopic" in data && data.sessionTopic) {
        return {
          isPairing: false,
          onboardingStatus: AccountOnboardStatus.SUCCESS,
          sessionTopic: data.sessionTopic,
          walletConnectUri: null,
        };
      }
      return null;

    default:
      return null;
  }
}
