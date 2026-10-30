import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { getPreviousTrackingPage } from "@shared/analytics";
import { isLegacyHandoff } from "../utils/exitActions";
import {
  restoreSeededPage,
  seededChecksPage,
  seededPages,
  toFirmwareUpdateAvailability,
  toSeededOutcome,
  trackSeededAborted,
  trackSeededClick,
  trackSeededPage,
  trackSeededStarted,
  type SeededClickPage,
  type SeededOutcome,
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
  const outcome = useMemo<SeededOutcome | null>(
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

  const trackStarted = useCallback((startOutcome: SeededOutcome | null) => {
    if (!startOutcome || started.current) return;
    started.current = true;
    trackSeededStarted(startOutcome);
  }, []);

  useEffect(() => {
    if (outcome?.firmwareUpdateAvailability === "unknown") return;
    trackStarted(outcome);
  }, [outcome, trackStarted]);

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

  /** Runs right before the exit actions, which track done or aborted. A legacy handoff has neither. */
  const trackExit = useCallback(
    (reason: DeviceOnboardingExitReason, exitContext: DeviceOnboardingContext) => {
      if (isLegacyHandoff(reason, exitContext)) return;
      trackStarted(toSeededOutcome(exitContext, firmwareUpdateDone));
    },
    [firmwareUpdateDone, trackStarted],
  );

  /** For a leave that does not go through the machine exit. */
  const trackAbort = useCallback(() => {
    if (!outcome) return;
    trackStarted(outcome);
    trackSeededAborted(outcome);
  }, [outcome, trackStarted]);

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
