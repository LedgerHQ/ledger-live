import { createFlowTracker } from "@shared/analytics";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { toChecksError, toChecksScreenState } from "../utils/checksPhase";
import { isCurrentSessionGenuine } from "../utils/genuineSession";
import { firmwareNeedsLegacyFlow } from "../utils/legacyFlow";

type YesNo = "yes" | "no";

export type FirmwareUpdateAvailability = YesNo | "unknown";

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

/** What the funnel learns on the way, sent with its start and its end. */
type SeededFacts = {
  seeded: boolean;
  deviceType: string;
  ledgerSyncEligible: boolean;
  firmwareUpdateAvailability: FirmwareUpdateAvailability;
  firmwareUpdateDone: boolean;
};

const initialFacts = (): SeededFacts => ({
  seeded: false,
  deviceType: "",
  ledgerSyncEligible: false,
  firmwareUpdateAvailability: "unknown",
  firmwareUpdateDone: false,
});

let facts = initialFacts();

const flow = createFlowTracker({
  props: () => ({
    sourceFlow: "onboarding",
    "onboarding type": "seeded device",
    seedConfiguration: "already_seeded",
    deviceType: facts.deviceType,
  }),
});

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");

/**
 * One funnel at a time: the checks screen resets it and the Sync offer can end it. Nothing is
 * sent until the device is known to be seeded.
 */
export const seededFunnel = {
  reset: () => {
    flow.reset();
    facts = initialFacts();
  },
  learn: (next: Partial<SeededFacts>) => {
    facts = { ...facts, ...next };
  },
  isTracked: () => facts.seeded,
  currentPage: () => flow.currentPage(),
  page: (name: string, props?: Record<string, string>) => {
    if (facts.seeded) flow.page(name, props);
  },
  openDrawer: (name: string, props?: Record<string, string>) => {
    if (facts.seeded) flow.openDrawer(name, props);
  },
  closeDrawer: () => flow.closeDrawer(),
  click: (button: string) => {
    if (facts.seeded) flow.click(button);
  },
  start: () => {
    if (!facts.seeded) return;
    flow.start("onboarding_started", {
      ledger_sync_eligibility: yesNo(facts.ledgerSyncEligible),
      firmware_update_availability: facts.firmwareUpdateAvailability,
    });
  },
  end: (result: "done" | "aborted", ledgerSyncDone = false) => {
    if (!facts.seeded) return;
    seededFunnel.start();
    flow.end(`onboarding_${result}`, {
      ledger_sync_done: yesNo(ledgerSyncDone),
      firmware_update_done: yesNo(facts.firmwareUpdateDone),
    });
  },
  /** Runs right before the exit actions navigate. */
  exit: (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => {
    if (context.onboardedOnEntry !== true) return;
    switch (seededExitResult(reason, context)) {
      case "done":
        return seededFunnel.end("done");
      case "aborted":
        return seededFunnel.end("aborted");
      case "syncOffer":
        return seededFunnel.start();
      case "legacyFlow":
        return flow.cancel();
    }
  },
};

export type SeededExitResult = "done" | "aborted" | "syncOffer" | "legacyFlow";

/** How each machine exit ends the funnel. It follows where `exitActions` sends the user. */
export function seededExitResult(
  reason: DeviceOnboardingExitReason,
  context: DeviceOnboardingContext,
): SeededExitResult {
  const genuine = isCurrentSessionGenuine(context);
  switch (reason) {
    case "completed":
      return "done";
    case "offerLedgerSync":
      return "syncOffer";
    case "resumeFirmwareUpdate":
      return "aborted";
    case "legacyFallback":
      if (context.isOnboarded !== true) return "legacyFlow";
      if (genuine) return "done";
      return firmwareNeedsLegacyFlow(context) ? "legacyFlow" : "aborted";
    case "userQuit":
      return genuine ? "done" : "aborted";
  }
}

export function toFirmwareUpdateAvailability(
  firmwareCheck: string | null,
): FirmwareUpdateAvailability {
  if (firmwareCheck === "offered") return "yes";
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
