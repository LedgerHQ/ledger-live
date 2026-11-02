import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { getPreviousTrackingPage } from "@shared/analytics";
import { isLegacyFlowExit } from "../utils/exitActions";
import {
  restoreSeededPage,
  seededChecksPage,
  seededPages,
  toFirmwareUpdateAvailability,
  toSeededResult,
  trackSeededAborted,
  trackSeededClick,
  trackSeededPage,
  trackSeededStarted,
  type SeededClickPage,
  type SeededResult,
} from "./seededTracking";

type Input = Readonly<{
  machineState: string | null;
  /** The machine context as plain data, as the onboarding session exposes it. */
  context: Readonly<Record<string, unknown>> | null | undefined;
  offerSync: boolean;
  firmwareUpdateDone: boolean;
}>;

/** Tracks the seeded funnel on the checks screens. Does nothing for an unseeded entry. */
export function useSeededFunnelTracking({
  machineState,
  context,
  offerSync,
  firmwareUpdateDone,
}: Input) {
  const seededOnEntry = context?.onboardedOnEntry === true;
  const deviceType = readString(context?.deviceModelId) ?? "";
  const page = seededOnEntry
    ? seededChecksPage(
        machineState,
        context?.checksPaused === true,
        readString(context?.genuineFailureKind),
      )
    : null;
  const firmwareUpdateAvailability = toFirmwareUpdateAvailability(
    readFirmwareCheck(context),
    firmwareUpdateDone,
  );
  const result = useMemo<SeededResult | null>(
    () =>
      seededOnEntry
        ? {
            deviceType,
            ledgerSyncEligible: offerSync,
            firmwareUpdateAvailability,
            firmwareUpdateDone,
          }
        : null,
    [seededOnEntry, deviceType, offerSync, firmwareUpdateAvailability, firmwareUpdateDone],
  );
  const started = useRef(false);
  const clickPage = useRef<SeededClickPage>({ page: "", source: "" });

  const trackStarted = useCallback((startResult: SeededResult | null) => {
    if (!startResult || started.current) return;
    started.current = true;
    trackSeededStarted(startResult);
  }, []);

  useEffect(() => {
    if (result?.firmwareUpdateAvailability === "unknown") return;
    trackStarted(result);
  }, [result, trackStarted]);

  useEffect(() => {
    if (!page) return;
    if (page === seededPages.osUpdateRequired) {
      trackSeededPage(seededPages.genuineCheckSuccess, deviceType);
    }
    trackSeededPage(page, deviceType);
    clickPage.current = { page, source: getPreviousTrackingPage() };
  }, [page, deviceType]);

  const trackClick = useCallback(
    (button: string) => {
      if (seededOnEntry) trackSeededClick(button, deviceType, clickPage.current);
    },
    [seededOnEntry, deviceType],
  );

  const trackUnsupportedUpdate = useCallback(
    (usbRequired: boolean) => {
      if (!seededOnEntry) return;
      trackSeededPage(seededPages.osUpdateUnsupported, deviceType, {
        reason: usbRequired ? "usb_required" : "not_eligible",
      });
    },
    [seededOnEntry, deviceType],
  );

  const trackUnsupportedUpdateClosed = useCallback(() => {
    restoreSeededPage(seededPages.osUpdateUnsupported, clickPage.current.page);
  }, []);

  /** Runs right before the exit actions, which track done or aborted. A legacy flow exit has neither. */
  const trackExit = useCallback(
    (reason: DeviceOnboardingExitReason, exitContext: DeviceOnboardingContext) => {
      if (isLegacyFlowExit(reason, exitContext)) return;
      trackStarted(toSeededResult(exitContext, firmwareUpdateDone));
    },
    [firmwareUpdateDone, trackStarted],
  );

  /** For a leave that does not go through the machine exit. */
  const trackAbort = useCallback(() => {
    if (!result) return;
    trackStarted(result);
    trackSeededAborted(result);
  }, [result, trackStarted]);

  return {
    page,
    trackClick,
    trackUnsupportedUpdate,
    trackUnsupportedUpdateClosed,
    trackExit,
    trackAbort,
  };
}

function readFirmwareCheck(context: Input["context"]): string | null {
  if (readString(context?.availableFirmwareVersion)) return "offered";
  if (context?.firmwareChecked === true) return "checked";
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
