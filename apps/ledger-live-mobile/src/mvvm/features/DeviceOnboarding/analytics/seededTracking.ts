import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  track,
  trackPage,
} from "@shared/analytics";
import { toChecksError } from "../utils/checksPhase";

type YesNo = "yes" | "no";

export const seededPages = {
  genuineCheck: "Genuine Check",
  genuineCheckStarted: "Genuine Check started",
  genuineCheckRefused: "Genuine Check refused on device",
  genuineCheckError: "Genuine Check error",
  checkOsVersion: "Check OS version",
  osUpdateRequired: "OS update required",
  checksSuccess: "Genuine Check & OS success",
  ledgerSync: "Ledger Sync",
  skipDrawer: "Drawer : Skip Ledger sync confirmation",
  ledgerSyncRefused: "Ledger Sync Refused",
  ledgerSyncSuccess: "Ledger Sync Success",
} as const;

export const seededCallerWins = [
  "platform",
  "sourceFlow",
  "onboarding type",
  "seedConfiguration",
  "deviceType",
  "deviceVersion",
] as const;

export const seededButtons = {
  initiateGenuineCheck: "Initiate Genuine Check",
  retryGenuineCheck: "Retry genuine check",
  continueUpdate: "Continue",
  activateSync: "Activate sync",
  skip: "Skip",
  learnMore: "Learn more",
  enableSync: "Enable sync",
  yesSkip: "Yes, skip",
  close: "close",
} as const;

type SeededSession = {
  started: boolean;
  finished: boolean;
  ledgerSyncEligibility: YesNo;
  firmwareUpdateAvailability: YesNo | null;
  firmwareUpdateDone: YesNo;
  ledgerSyncDone: YesNo;
  deviceType?: string;
  deviceVersion?: string;
};

const freshSession = (): SeededSession => ({
  started: false,
  finished: false,
  ledgerSyncEligibility: "no",
  firmwareUpdateAvailability: null,
  firmwareUpdateDone: "no",
  ledgerSyncDone: "no",
});

let session = freshSession();
let lastSeededPage = "";
let pageSource: string | null = null;

export function resetSeededOnboardingAnalytics(): void {
  session = freshSession();
  lastSeededPage = "";
  pageSource = null;
}

export function rememberSeededOnboarding(input: {
  ledgerSyncEligible?: boolean;
  deviceType?: string | null;
  deviceVersion?: string | null;
  updateOffered?: boolean;
  firmwareChecked?: boolean;
}): void {
  if (input.ledgerSyncEligible !== undefined) {
    session.ledgerSyncEligibility = input.ledgerSyncEligible ? "yes" : "no";
  }
  if (input.deviceType && !session.deviceType) session.deviceType = input.deviceType;
  if (input.deviceVersion) session.deviceVersion = input.deviceVersion;
  if (input.updateOffered) session.firmwareUpdateAvailability = "yes";
  else if (input.firmwareChecked && session.firmwareUpdateAvailability !== "yes") {
    session.firmwareUpdateAvailability = "no";
  }
}

export function seededSharedProps(): {
  platform: "lwm";
  sourceFlow: "onboarding";
  "onboarding type": "seeded device";
  seedConfiguration: "already_seeded";
  deviceType?: string;
  deviceVersion?: string;
} {
  return {
    platform: "lwm",
    sourceFlow: "onboarding",
    "onboarding type": "seeded device",
    seedConfiguration: "already_seeded",
    ...(session.deviceType ? { deviceType: session.deviceType } : {}),
    ...(session.deviceVersion ? { deviceVersion: session.deviceVersion } : {}),
  };
}

export function seededCheckPage(
  machineState: string | null,
  checksPaused: boolean,
  genuineFailureKind: string | null,
): string | null {
  if (machineState === "awaitingStart") return seededPages.genuineCheck;
  if (machineState === "checks.checksIdle" && checksPaused) return seededPages.genuineCheck;
  if (!machineState?.startsWith("checks.")) return null;
  if (machineState.startsWith("checks.genuineCheck")) return seededPages.genuineCheckStarted;
  if (
    machineState === "checks.genuineFailed" ||
    machineState === "checks.notGenuineSupport" ||
    machineState === "checks.firmwareCheckFailed"
  ) {
    const error = toChecksError(machineState, genuineFailureKind);
    return error?.kind === "declined"
      ? seededPages.genuineCheckRefused
      : seededPages.genuineCheckError;
  }
  if (machineState.startsWith("checks.firmwareUpdateOffered")) return seededPages.osUpdateRequired;
  if (machineState === "checks.firmwareCheck" || machineState.startsWith("checks.firmwareCheck.")) {
    return seededPages.checkOsVersion;
  }
  if (
    machineState === "checks.checksSucceeded" ||
    machineState === "checks.checksDone" ||
    machineState === "checks.leavingEarlyCheckScreen"
  ) {
    return seededPages.checksSuccess;
  }
  return null;
}

function sourceProp(page?: string | null): { source?: string } {
  const live = getPreviousTrackingPage();
  const current = page || getCurrentTrackingPage();
  const collapsed = Boolean(live) && live === current;
  const source = !live || collapsed ? pageSource || undefined : live;
  return source ? { source } : {};
}

export function trackSeededPage(page: string): void | Promise<void> {
  pageSource = getCurrentTrackingPage();
  lastSeededPage = page;
  return trackPage(
    { category: page, props: seededSharedProps() },
    { updateRoutes: true, refreshSource: true, callerWins: seededCallerWins },
  );
}

export function trackSeededChecksSuccess(): void | Promise<void> {
  if (lastSeededPage === seededPages.checksSuccess) return;
  return trackSeededPage(seededPages.checksSuccess);
}

export function trackSeededClick(button: string, page?: string | null): Promise<void> {
  const currentPage = page || getCurrentTrackingPage();
  return track(
    "button_clicked",
    {
      ...seededSharedProps(),
      ...sourceProp(currentPage),
      button,
      ...(currentPage ? { page: currentPage } : {}),
    },
    { callerWins: seededCallerWins },
  );
}

export function trackSeededOnboardingStarted(): void | Promise<void> {
  if (session.started || session.firmwareUpdateAvailability === null) return;
  session.started = true;
  return track(
    "onboarding_started",
    {
      ...seededSharedProps(),
      ...sourceProp(),
      ledger_sync_eligibility: session.ledgerSyncEligibility,
      firmware_update_availability: session.firmwareUpdateAvailability,
    },
    { callerWins: seededCallerWins },
  );
}

function trackSeededOnboardingStartedOnLeave(): void {
  session.firmwareUpdateAvailability ??= "no";
  void trackSeededOnboardingStarted();
}

export function markFirmwareUpdateAccepted(): void {
  session.firmwareUpdateDone = "yes";
  session.firmwareUpdateAvailability = "yes";
}

export function markLedgerSyncDone(): void {
  session.ledgerSyncDone = "yes";
}

function outcomeProps() {
  return {
    ...seededSharedProps(),
    ...sourceProp(),
    ledger_sync_done: session.ledgerSyncDone,
    firmware_update_done: session.firmwareUpdateDone,
  };
}

export function trackSeededOnboardingDone(): void | Promise<void> {
  trackSeededOnboardingStartedOnLeave();
  if (session.finished) return;
  session.finished = true;
  return track("onboarding_done", outcomeProps(), { callerWins: seededCallerWins });
}

export function trackSeededOnboardingAborted(): void | Promise<void> {
  trackSeededOnboardingStartedOnLeave();
  if (session.finished) return;
  session.finished = true;
  return track("onboarding_aborted", outcomeProps(), { callerWins: seededCallerWins });
}
