import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import {
  onboardingPages,
  onboardingScreen,
  seededProps,
  toSeededResult,
  trackOnboardingClick,
  trackSeededAborted,
  trackSeededDone,
  trackSeededStarted,
  type FunnelProps,
  type OnboardingButton,
  type OnboardingPage,
  type SeededResult,
} from "@features/platform-device-onboarding-analytics";
import type { TrackedScreen, UpdateStep } from "../types";
import { exitOutcome } from "../utils/exitActions";
import { checksPage } from "./checksPage";
import { trackedScreen as tracked, updateStepScreen } from "./checksTracking";

type Input = Readonly<{
  /** The state the screen shows, so a held screen (device locked or off) sends no page again. */
  machineState: string | null;
  machineContext: DeviceOnboardingContext | null;
  firmwareUpdateStarted: boolean;
}>;

export type SeededFunnelTracking = Readonly<{
  /** Set only in the seeded funnel: the drawers then send the seeded page names. */
  funnelProps: FunnelProps | null;
  trackClick: (button: OnboardingButton) => void;
  screensFor: (step: UpdateStep | null) => readonly TrackedScreen[];
  /** Sends the end event of a machine exit. Returns the result the Sync offer screen needs. */
  trackExit: (
    reason: DeviceOnboardingExitReason,
    context: DeviceOnboardingContext,
  ) => SeededResult | null;
  /** Sends the end event when the user leaves without a machine exit. */
  trackAbort: () => void;
}>;

const pagesTrackedByDrawers = new Set<OnboardingPage>([
  onboardingPages.genuineCheckRefused,
  onboardingPages.genuineCheckError,
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
  const funnelProps = useMemo(() => (deviceType ? seededProps(deviceType) : null), [deviceType]);
  const page =
    result && machineContext
      ? checksPage(
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
    (button: OnboardingButton) => {
      if (funnelProps) trackOnboardingClick(button, funnelProps);
    },
    [funnelProps],
  );

  const screensFor = useCallback(
    (step: UpdateStep | null): readonly TrackedScreen[] => {
      if (!page || !result || !funnelProps || pagesTrackedByDrawers.has(page)) return [];
      const availability = { firmware_update_availability: result.firmwareUpdateAvailability };
      const genuineSuccess = onboardingScreen(
        onboardingPages.genuineCheckSuccess,
        funnelProps,
        availability,
      );
      if (page === onboardingPages.checksSuccess) {
        // Its own key: after a skipped update, the result page is sent again, as a new screen.
        const resultPage = firmwareUpToDate
          ? onboardingScreen(page, funnelProps, availability)
          : genuineSuccess;
        return [tracked("result", resultPage)];
      }
      if (page !== onboardingPages.osUpdateRequired) {
        return [tracked("checks", onboardingScreen(page, funnelProps))];
      }
      const beforeUpdate = tracked("beforeUpdate", genuineSuccess);
      return step
        ? [beforeUpdate, tracked("update", updateStepScreen(step, funnelProps))]
        : [beforeUpdate];
    },
    [page, result, funnelProps, firmwareUpToDate],
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

  return { funnelProps, trackClick, screensFor, trackExit, trackAbort };
}
