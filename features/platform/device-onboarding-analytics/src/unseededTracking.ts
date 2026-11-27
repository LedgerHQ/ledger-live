import { track } from "@shared/analytics";
import { RecoveryKeyStatus, SeedPath } from "@features/platform-device-onboarding";
import {
  onboardingPages,
  onboardingScreen,
  trackOnboardingPage,
  withSource,
  type FunnelProps,
  type OnboardingPage,
  type ScreenTracking,
} from "./funnelTracking";
import { yesNo } from "./internals/yesNo";
import type { FirmwareUpdateAvailability } from "./seededTracking";

export type UnseededStatus = Readonly<{
  ledgerSyncEligible: boolean;
  firmwareUpdateAvailability: FirmwareUpdateAvailability;
}>;

function statusProps(status: UnseededStatus) {
  return {
    ledger_sync_eligibility: yesNo(status.ledgerSyncEligible),
    firmware_update_availability: status.firmwareUpdateAvailability,
  };
}

function trackUnseededMilestone(
  event: "onboarding_started" | "onboarding_device_setup_finished" | "onboarding_Ledger_Recover",
  props: FunnelProps,
  status: UnseededStatus,
): void {
  track(event, withSource({ ...props, ...statusProps(status) }));
}

export function trackUnseededStarted(props: FunnelProps, status: UnseededStatus): void {
  trackUnseededMilestone("onboarding_started", props, status);
}

export function trackUnseededSetupFinished(props: FunnelProps, status: UnseededStatus): void {
  trackUnseededMilestone("onboarding_device_setup_finished", props, status);
}

export type UnseededResult = Readonly<{
  ledgerSyncDone: boolean;
  firmwareUpdateDone: boolean;
}>;

export function trackUnseededDone(
  props: FunnelProps,
  status: UnseededStatus,
  result: UnseededResult,
): void {
  track(
    "onboarding_done",
    withSource({
      ...props,
      ...statusProps(status),
      ledger_sync_done: yesNo(result.ledgerSyncDone),
      firmware_update_done: yesNo(result.firmwareUpdateDone),
    }),
  );
}

export function trackRecoverOffered(props: FunnelProps, status: UnseededStatus): void {
  trackUnseededMilestone("onboarding_Ledger_Recover", props, status);
}

export const karaokes = {
  intro: { karaokeType: "unseeded-intro", page: onboardingPages.introKaraoke },
  recover: { karaokeType: "Ledger Recover", page: onboardingPages.recoverKaraoke },
} as const;

export type KaraokeTracking = (typeof karaokes)[keyof typeof karaokes];

function karaokeOpening(karaoke: KaraokeTracking, phraseCount: number) {
  return { karaokeType: karaoke.karaokeType, phraseIndex: 1, phraseCount };
}

/** The karaoke page as it opens on its first phrase, for a `TrackScreen`. */
export function karaokeScreen(
  karaoke: KaraokeTracking,
  props: FunnelProps,
  phraseCount: number,
): ScreenTracking {
  return onboardingScreen(karaoke.page, props, karaokeOpening(karaoke, phraseCount));
}

export function trackKaraokePage(
  karaoke: KaraokeTracking,
  props: FunnelProps,
  phraseCount: number,
): void {
  trackOnboardingPage(karaoke.page, props, karaokeOpening(karaoke, phraseCount));
}

/** `shownIndex` is the phrase now on screen, counted from 0. */
export function trackKaraokeAdvanced(
  karaoke: KaraokeTracking,
  props: FunnelProps,
  shownIndex: number,
  phraseCount: number,
): void {
  track(
    "karaoke_advanced",
    withSource({
      ...props,
      karaokeType: karaoke.karaokeType,
      phraseIndex: shownIndex + 1,
      phraseCount,
      page: karaoke.page,
    }),
  );
}

export function trackKaraokeCompleted(karaoke: KaraokeTracking, props: FunnelProps): void {
  track("karaoke_completed", withSource({ ...props, karaokeType: karaoke.karaokeType }));
}

const setupPageByState = new Map<string, OnboardingPage>([
  ["deviceSetup.naming", onboardingPages.deviceName],
  ["deviceSetup.pin", onboardingPages.pinSetup],
  ["deviceSetup.setupChoice", onboardingPages.setupChoice],
  ["deviceSetup.newSeed", onboardingPages.newSeedStart],
  ["deviceSetup.backupRecoveryKey", onboardingPages.recoveryKeyStart],
  ["deviceSetup.restoreChoice", onboardingPages.restoreChoice],
  ["deviceSetup.restoreWords", onboardingPages.restorePhraseStart],
  ["deviceSetup.restoreRecoveryKey", onboardingPages.restoreRecoveryKeyStart],
  ["deviceSetup.restoreRecover", onboardingPages.restoreRecover],
]);

/** The page of a device setup step, or null for a state with no page (waiting, locked). */
export function setupPage(machineState: string | null): OnboardingPage | null {
  return machineState ? (setupPageByState.get(machineState) ?? null) : null;
}

/** The pages that close the setup path, sent once the device is ready. */
export function setupSuccessPages(
  seedPath: SeedPath | null,
  recoveryKeyStatus: RecoveryKeyStatus | null,
): OnboardingPage[] {
  switch (seedPath) {
    case SeedPath.NewSeed:
      return [onboardingPages.newSeedSuccess, ...recoveryKeyResult(recoveryKeyStatus)];
    case SeedPath.RestorePhrase:
      return [onboardingPages.restorePhraseSuccess];
    case SeedPath.RecoveryKey:
      return [onboardingPages.restoreRecoveryKeySuccess];
    default:
      return [];
  }
}

/** Only a status the device reported: any other one leaves the Recovery Key result unknown. */
function recoveryKeyResult(status: RecoveryKeyStatus | null): OnboardingPage[] {
  if (status === RecoveryKeyStatus.Ready) return [onboardingPages.recoveryKeySuccess];
  if (status === RecoveryKeyStatus.Rejected) return [onboardingPages.recoveryKeyRejected];
  return [];
}
