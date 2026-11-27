import { track } from "@shared/analytics";
import type { DeviceOnboardingContext, FirmwareCheck } from "@features/platform-device-onboarding";
import { seededProps, withSource, type DeviceModelId } from "./funnelTracking";
import { yesNo, type YesNo } from "./internals/yesNo";

export type FirmwareUpdateAvailability = YesNo | "unknown";

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
