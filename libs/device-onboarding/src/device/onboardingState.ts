import {
  GetOsVersionCommand,
  isSuccessCommandResult,
  type DeviceManagementKit,
  type DeviceSessionId,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { OnboardingStep, type DeviceOnboardingState, type SeedPhraseWordCount } from "../types";

export type SeedProgress = {
  seedWordIndex: number;
  seedPhraseWordCount: SeedPhraseWordCount;
};

export async function sendOsVersionCommand(
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
): Promise<GetOsVersionResponse> {
  const result = await dmk.sendCommand({ sessionId, command: new GetOsVersionCommand() });

  if (!isSuccessCommandResult(result)) {
    throw result.error;
  }

  return result.data;
}

/** DMK decodes only the first secure element flag byte, so these three are absent from its response type. */
type OnboardingFlags = {
  onboardingState?: string;
  numberOfWords?: number;
  currentWordIndex?: number;
};

const onboardingSteps = new Set<string>(Object.values(OnboardingStep));
const seedPhraseWordCounts = new Set([12, 18, 24]);

export function readOnboardingState(response: GetOsVersionResponse): DeviceOnboardingState | null {
  const currentOnboardingStep = readOnboardingStep(response);
  const seedProgress = readWordsInformation(response);

  if (currentOnboardingStep === null || seedProgress === null) {
    return null;
  }

  const flags = response.secureElementFlags;

  return {
    isOnboarded: flags.isOnboarded,
    isInRecoveryMode: flags.isInRecoveryMode,
    managerAllowed: flags.isSecureConnectionAllowed,
    currentOnboardingStep,
    ...seedProgress,
  };
}

export function isSameOnboardingState(
  previous: DeviceOnboardingState | undefined,
  next: DeviceOnboardingState,
): boolean {
  return (
    previous !== undefined &&
    previous.isOnboarded === next.isOnboarded &&
    previous.isInRecoveryMode === next.isInRecoveryMode &&
    previous.managerAllowed === next.managerAllowed &&
    previous.currentOnboardingStep === next.currentOnboardingStep &&
    previous.seedWordIndex === next.seedWordIndex &&
    previous.seedPhraseWordCount === next.seedPhraseWordCount
  );
}

export function readOnboardingStep(response: GetOsVersionResponse): OnboardingStep | null {
  const { onboardingState } = onboardingFlags(response);

  if (onboardingState === undefined || !onboardingSteps.has(onboardingState)) {
    return null;
  }

  return onboardingState as OnboardingStep;
}

export function readWordsInformation(response: GetOsVersionResponse): SeedProgress | null {
  const { numberOfWords, currentWordIndex } = onboardingFlags(response);

  if (typeof currentWordIndex !== "number" || !isSeedPhraseWordCount(numberOfWords)) {
    return null;
  }

  return { seedWordIndex: currentWordIndex, seedPhraseWordCount: numberOfWords };
}

function onboardingFlags(response: GetOsVersionResponse): OnboardingFlags {
  return response.secureElementFlags as OnboardingFlags;
}

function isSeedPhraseWordCount(value: number | undefined): value is SeedPhraseWordCount {
  return value !== undefined && seedPhraseWordCounts.has(value);
}
