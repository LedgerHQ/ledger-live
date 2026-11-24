import { getPreviousTrackingPage, track, trackPage } from "@shared/analytics";
import type { DeviceOnboardingContext, FirmwareCheck } from "@features/platform-device-onboarding";

type YesNo = "yes" | "no";

export type FirmwareUpdateAvailability = YesNo | "unknown";

export type TrackingProps = Readonly<Record<string, string>>;

/** The device model, as the machine context holds it. It becomes a string only in the payload. */
export type DeviceModelId = DeviceOnboardingContext["deviceModelId"];

export type SeededStart = Readonly<{
  deviceType: DeviceModelId;
  ledgerSyncEligible: boolean;
}>;

export type SeededResult = SeededStart &
  Readonly<{
    firmwareUpdateAvailability: FirmwareUpdateAvailability;
    firmwareUpdateStarted: boolean;
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
  osUpdateRefusal: "OS update required refusal screen",
  osUpdateUnsupported: "Drawer : OS update unsupported",
  checksSuccess: "Genuine Check & OS success",
  ledgerSync: "Ledger Sync",
  ledgerSyncRefused: "Ledger Sync Refused",
  ledgerSyncSuccess: "Ledger Sync Success",
} as const;

export type SeededPage = (typeof seededPages)[keyof typeof seededPages];

export type ScreenTracking = Readonly<{ category: SeededPage }> & TrackingProps;

export const seededButtons = {
  initiateGenuineCheck: "Initiate Genuine Check",
  retryGenuineCheck: "Retry genuine check",
  continue: "Continue",
  installUpdate: "Install Ledger OS update",
  skipUpdate: "Skip Ledger OS update",
  activateSync: "Activate sync",
  skip: "Skip",
  learnMore: "Learn more",
  enableSync: "Enable sync",
  yesSkip: "Yes, skip",
  close: "close",
} as const;

export type SeededButton = (typeof seededButtons)[keyof typeof seededButtons];

type SeededProps = Readonly<{
  sourceFlow: "onboarding";
  "onboarding type": "seeded device";
  seedConfiguration: "already_seeded";
  deviceType: string;
}>;

export function seededProps(deviceType: DeviceModelId): SeededProps {
  return {
    sourceFlow: "onboarding",
    "onboarding type": "seeded device",
    seedConfiguration: "already_seeded",
    deviceType,
  };
}

export function seededScreen(
  page: SeededPage,
  deviceType: DeviceModelId,
  extraProps: TrackingProps = {},
): ScreenTracking {
  return { category: page, ...seededProps(deviceType), ...extraProps };
}

const yesNo = (value: boolean): YesNo => (value ? "yes" : "no");

function withSource<T extends object>(props: T): T & { source?: string } {
  const source = getPreviousTrackingPage();
  return source ? { source, ...props } : props;
}

export function toSeededResult(
  context: DeviceOnboardingContext,
  firmwareUpdateStarted: boolean,
): SeededResult | null {
  if (context.onboardedOnEntry !== true) return null;
  const firmwareCheck = context.firmware?.kind ?? null;
  return {
    deviceType: context.deviceModelId,
    ledgerSyncEligible: context.offerSync,
    firmwareUpdateAvailability: toFirmwareUpdateAvailability(firmwareCheck, firmwareUpdateStarted),
    firmwareUpdateStarted,
    firmwareUpdateDone: isFirmwareUpdateDone(firmwareCheck, firmwareUpdateStarted),
  };
}

export function toFirmwareUpdateAvailability(
  firmwareCheck: FirmwareCheck["kind"] | null,
  firmwareUpdateStarted: boolean,
): FirmwareUpdateAvailability {
  if (firmwareUpdateStarted) return "yes";
  if (firmwareCheck === "offered" || firmwareCheck === "declined") return "yes";
  if (firmwareCheck === "upToDate") return "no";
  return "unknown";
}

export function isFirmwareUpdateDone(
  firmwareCheck: FirmwareCheck["kind"] | null,
  firmwareUpdateStarted: boolean,
): boolean {
  return firmwareUpdateStarted && firmwareCheck === "upToDate";
}

export function trackSeededPage(
  page: SeededPage,
  deviceType: DeviceModelId,
  extraProps: TrackingProps = {},
): void {
  trackPage(
    { category: page, props: { ...seededProps(deviceType), ...extraProps } },
    { updateRoutes: true, refreshSource: true },
  );
}

export function trackSeededClick(button: SeededButton, deviceType: DeviceModelId): void {
  track("button_clicked", withSource({ ...seededProps(deviceType), button }));
}

export function trackSeededStarted(start: SeededStart): void {
  track(
    "onboarding_started",
    withSource({
      ...seededProps(start.deviceType),
      ledger_sync_eligibility: yesNo(start.ledgerSyncEligible),
    }),
  );
}

function trackSeededEnd(
  event: "onboarding_done" | "onboarding_aborted",
  result: SeededResult,
  ledgerSyncDone: boolean,
): void {
  track(
    event,
    withSource({
      ...seededProps(result.deviceType),
      ledger_sync_done: yesNo(ledgerSyncDone),
      firmware_update_availability: result.firmwareUpdateAvailability,
      firmware_update_started: yesNo(result.firmwareUpdateStarted),
      firmware_update_done: yesNo(result.firmwareUpdateDone),
    }),
  );
}

export function trackSeededDone(result: SeededResult, ledgerSyncDone = false): void {
  trackSeededEnd("onboarding_done", result, ledgerSyncDone);
}

export function trackSeededAborted(result: SeededResult): void {
  trackSeededEnd("onboarding_aborted", result, false);
}
