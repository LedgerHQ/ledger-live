import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  setTrackingSource,
  track,
  trackPage,
} from "@shared/analytics";
import type { DeviceOnboardingContext } from "@features/platform-device-onboarding";
import { toChecksError, toChecksScreenState } from "../utils/checksPhase";

type YesNo = "yes" | "no";

export type FirmwareUpdateAvailability = YesNo | "unknown";

/** What the seeded funnel knows about its outcome, carried from the checks to the Sync offer. */
export type SeededOutcome = Readonly<{
  deviceType: string;
  ledgerSyncEligible: boolean;
  firmwareUpdateAvailability: FirmwareUpdateAvailability;
  firmwareUpdateDone: boolean;
}>;

export const seededPages = {
  genuineCheck: "Genuine Check",
  genuineCheckStarted: "Genuine Check started",
  genuineCheckRefused: "Genuine Check refused on device",
  genuineCheckError: "Genuine Check error",
  genuineCheckSuccess: "Genuine Check success",
  checkOsVersion: "Check OS version",
  osUpdateRequired: "OS update required",
  osUpdateUnsupported: "Drawer : OS update unsupported",
  checksSuccess: "Genuine Check & OS success",
  ledgerSync: "Ledger Sync",
  skipLedgerSyncDrawer: "Drawer : Skip Ledger sync confirmation",
  ledgerSyncRefused: "Ledger Sync Refused",
  ledgerSyncSuccess: "Ledger Sync Success",
} as const;

export const seededButtons = {
  initiateGenuineCheck: "Initiate Genuine Check",
  retryGenuineCheck: "Retry genuine check",
  continue: "Continue",
  activateSync: "Activate sync",
  skip: "Skip",
  learnMore: "Learn more",
  enableSync: "Enable sync",
  yesSkip: "Yes, skip",
  close: "close",
} as const;

export function seededProps(deviceType: string) {
  return {
    sourceFlow: "onboarding",
    "onboarding type": "seeded device",
    seedConfiguration: "already_seeded",
    deviceType,
  } as const;
}

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");

/** Fire and forget: the helpers return nothing, so call sites hold no promise. */
function send(delivery: void | Promise<void>): void {
  Promise.resolve(delivery).catch(() => undefined);
}

function withSource<T extends object>(props: T): T & { source?: string } {
  const source = getPreviousTrackingPage();
  return source ? { source, ...props } : props;
}

/** Null for an unseeded entry: only the seeded funnel is tracked. */
export function toSeededOutcome(
  context: DeviceOnboardingContext,
  firmwareUpdateDone: boolean,
): SeededOutcome | null {
  if (context.onboardedOnEntry !== true) return null;
  return {
    deviceType: context.deviceModelId,
    ledgerSyncEligible: context.offerSync,
    firmwareUpdateAvailability: toFirmwareUpdateAvailability(
      context.firmware?.kind ?? null,
      firmwareUpdateDone,
    ),
    firmwareUpdateDone,
  };
}

export function toFirmwareUpdateAvailability(
  firmwareCheck: string | null,
  firmwareUpdateDone: boolean,
): FirmwareUpdateAvailability {
  if (firmwareUpdateDone || firmwareCheck === "offered") return "yes";
  if (firmwareCheck === "checked") return "no";
  return "unknown";
}

/** The page the checks screen shows, read from the same screen state the UI renders. */
export function seededChecksPage(
  machineState: string | null,
  checksPaused: boolean,
  genuineFailureKind: string | null,
): string | null {
  const error = toChecksError(machineState, genuineFailureKind);
  if (error) {
    return error.kind === "declined"
      ? seededPages.genuineCheckRefused
      : seededPages.genuineCheckError;
  }
  switch (toChecksScreenState(machineState, checksPaused, true)) {
    case "idle":
      return seededPages.genuineCheck;
    case "awaitingAllow":
      return seededPages.genuineCheckStarted;
    case "updating":
      return seededPages.osUpdateRequired;
    case "succeeded":
      return seededPages.checksSuccess;
    case "checking":
      if (machineState?.startsWith("checks.genuineCheck")) return seededPages.genuineCheckStarted;
      if (machineState?.startsWith("checks.firmwareCheck")) return seededPages.checkOsVersion;
      return null;
    default:
      return null;
  }
}

export function trackSeededPage(
  page: string,
  deviceType: string,
  extraProps: Record<string, string> = {},
): void {
  send(
    trackPage(
      { category: page, props: { ...seededProps(deviceType), ...extraProps } },
      { updateRoutes: true, refreshSource: true },
    ),
  );
}

/** The screen a click happens on, and that screen's own source. */
export type SeededClickPage = Readonly<{ page: string; source: string }>;

/** Takes the page explicitly: a drawer over the screen moves the shared page refs. */
export function trackSeededClick(
  button: string,
  deviceType: string,
  { page, source }: SeededClickPage,
): void {
  const props = { ...seededProps(deviceType), button, page };
  send(track("button_clicked", source ? { source, ...props } : props));
}

/** Puts a screen back as the current page once a drawer over it is dismissed. */
export function restoreSeededPage(drawerPage: string, page: string): void {
  if (getCurrentTrackingPage() === drawerPage) setTrackingSource(page);
}

export function trackSeededStarted(outcome: SeededOutcome): void {
  send(
    track(
      "onboarding_started",
      withSource({
        ...seededProps(outcome.deviceType),
        ledger_sync_eligibility: yesNo(outcome.ledgerSyncEligible),
        firmware_update_availability: outcome.firmwareUpdateAvailability,
      }),
    ),
  );
}

function trackSeededEnd(
  event: "onboarding_done" | "onboarding_aborted",
  outcome: SeededOutcome,
  ledgerSyncDone: boolean,
): void {
  send(
    track(
      event,
      withSource({
        ...seededProps(outcome.deviceType),
        ledger_sync_done: yesNo(ledgerSyncDone),
        firmware_update_done: yesNo(outcome.firmwareUpdateDone),
      }),
    ),
  );
}

export function trackSeededDone(outcome: SeededOutcome, ledgerSyncDone = false): void {
  trackSeededEnd("onboarding_done", outcome, ledgerSyncDone);
}

export function trackSeededAborted(outcome: SeededOutcome): void {
  trackSeededEnd("onboarding_aborted", outcome, false);
}
