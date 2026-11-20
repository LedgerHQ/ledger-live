import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import {
  seededPages,
  seededScreen,
  toSeededResult,
  trackSeededAborted,
  trackSeededClick,
  trackSeededDone,
  trackSeededStarted,
  type DeviceModelId,
  type ScreenTracking,
  type SeededButton,
  type SeededPage,
  type SeededResult,
} from "@features/platform-device-onboarding-analytics";
import type { TrackedScreen, UpdateStep } from "../types";
import { exitOutcome } from "../utils/exitActions";
import { seededChecksPage } from "./seededChecksPage";

type Input = Readonly<{
  /** The state the screen shows, so a held screen (device locked or off) sends no page again. */
  machineState: string | null;
  machineContext: DeviceOnboardingContext | null;
  firmwareUpdateStarted: boolean;
}>;

export type SeededFunnelTracking = Readonly<{
  /** Set only in the seeded funnel: the drawers then send the seeded page names. */
  seededDeviceType: DeviceModelId | null;
  trackClick: (button: SeededButton) => void;
  screensFor: (step: UpdateStep | null) => readonly TrackedScreen[];
  /** Sends the end event of a machine exit. Returns the result the Sync offer screen needs. */
  trackExit: (
    reason: DeviceOnboardingExitReason,
    context: DeviceOnboardingContext,
  ) => SeededResult | null;
  /** Sends the end event when the user leaves without a machine exit. */
  trackAbort: () => void;
}>;

const pagesTrackedByDrawers = new Set<SeededPage>([
  seededPages.genuineCheckRefused,
  seededPages.genuineCheckError,
]);

export function useSeededFunnelTracking({
  machineState,
  machineContext,
  firmwareUpdateStarted,
}: Input): SeededFunnelTracking {
  const result = useMemo(
    () => (machineContext ? toSeededResult(machineContext, firmwareUpdateStarted) : null),
    [machineContext, firmwareUpdateStarted],
  );
  const deviceType = result?.deviceType ?? null;
  const page =
    result && machineContext
      ? seededChecksPage(
          machineState,
          machineContext.checksPaused,
          machineContext.lastGenuineFailure?.kind ?? null,
        )
      : null;
  const firmwareUpToDate = machineContext?.firmware?.kind === "upToDate";
  const started = useRef(false);

  const trackStarted = useCallback((start: SeededResult) => {
    if (started.current) return;
    started.current = true;
    trackSeededStarted(start);
  }, []);

  useEffect(() => {
    if (page && result) trackStarted(result);
  }, [page, result, trackStarted]);

  const trackClick = useCallback(
    (button: SeededButton) => {
      if (deviceType) trackSeededClick(button, deviceType);
    },
    [deviceType],
  );

  const screensFor = useCallback(
    (step: UpdateStep | null): readonly TrackedScreen[] => {
      if (!page || !result || pagesTrackedByDrawers.has(page)) return [];
      const { deviceType: type } = result;
      const availability = { firmware_update_availability: result.firmwareUpdateAvailability };
      const genuineSuccess = seededScreen(seededPages.genuineCheckSuccess, type, availability);
      if (page === seededPages.checksSuccess) {
        // Its own key: after a skipped update, the result page is sent again, as a new screen.
        const resultPage = firmwareUpToDate
          ? seededScreen(page, type, availability)
          : genuineSuccess;
        return [tracked("result", resultPage)];
      }
      if (page !== seededPages.osUpdateRequired) {
        return [tracked("checks", seededScreen(page, type))];
      }
      const beforeUpdate = tracked("beforeUpdate", genuineSuccess);
      return step
        ? [beforeUpdate, tracked("update", updateStepScreen(step, type))]
        : [beforeUpdate];
    },
    [page, result, firmwareUpToDate],
  );

  const trackExit = useCallback(
    (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => {
      const exitResult = toSeededResult(context, firmwareUpdateStarted);
      const outcome = exitOutcome(reason, context);
      if (!exitResult || outcome === "legacy") return null;
      trackStarted(exitResult);
      if (outcome === "done") trackSeededDone(exitResult);
      if (outcome === "aborted") trackSeededAborted(exitResult);
      return exitResult;
    },
    [firmwareUpdateStarted, trackStarted],
  );

  const trackAbort = useCallback(() => {
    if (!result) return;
    trackStarted(result);
    trackSeededAborted(result);
  }, [result, trackStarted]);

  return { seededDeviceType: deviceType, trackClick, screensFor, trackExit, trackAbort };
}

function updateStepScreen(step: UpdateStep, deviceType: DeviceModelId): ScreenTracking {
  switch (step) {
    case "offerSheet":
      return seededScreen(seededPages.osUpdateRequired, deviceType);
    case "decisionScreen":
      return seededScreen(seededPages.osUpdateRefusal, deviceType);
    case "unsupportedUsbDrawer":
      return seededScreen(seededPages.osUpdateUnsupported, deviceType, { reason: "usb_required" });
    case "unsupportedNotEligibleDrawer":
      return seededScreen(seededPages.osUpdateUnsupported, deviceType, { reason: "not_eligible" });
  }
}

function tracked(slot: string, tracking: ScreenTracking): TrackedScreen {
  const reason = typeof tracking.reason === "string" ? `:${tracking.reason}` : "";
  return { key: `${slot}:${tracking.category}${reason}`, tracking };
}
