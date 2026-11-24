import {
  onboardingPages,
  onboardingScreen,
  trackOnboardingClick,
  type FunnelProps,
  type OnboardingButton,
  type ScreenTracking,
} from "@features/platform-device-onboarding-analytics";
import type { TrackedScreen, UpdateStep } from "../types";

/** What the checks screen needs to send its sheet pages and clicks, for either funnel. */
export type ChecksTracking = Readonly<{
  /** Set in a tracked funnel: the drawers then send the funnel page names with these props. */
  funnelProps: FunnelProps | null;
  trackClick: (button: OnboardingButton) => void;
  screensFor: (step: UpdateStep | null) => readonly TrackedScreen[];
}>;

export function updateStepScreen(step: UpdateStep, funnelProps: FunnelProps): ScreenTracking {
  switch (step) {
    case "offerSheet":
      return onboardingScreen(onboardingPages.osUpdateRequired, funnelProps);
    case "decisionScreen":
      return onboardingScreen(onboardingPages.osUpdateRefusal, funnelProps);
    case "unsupportedUsbDrawer":
      return onboardingScreen(onboardingPages.osUpdateUnsupported, funnelProps, {
        reason: "usb_required",
      });
    case "unsupportedNotEligibleDrawer":
      return onboardingScreen(onboardingPages.osUpdateUnsupported, funnelProps, {
        reason: "not_eligible",
      });
  }
}

export function trackedScreen(slot: string, tracking: ScreenTracking): TrackedScreen {
  const reason = typeof tracking.reason === "string" ? `:${tracking.reason}` : "";
  return { key: `${slot}:${tracking.category}${reason}`, tracking };
}

/**
 * The checks screen of an unseeded device: its held-back OS update after setup, or the checks
 * again after a reconnect. The machine-state pages come from the funnel hook, so only the
 * update sheets are sent here.
 */
export function unseededChecksTracking(funnelProps: FunnelProps): ChecksTracking {
  return {
    funnelProps,
    trackClick: button => trackOnboardingClick(button, funnelProps),
    screensFor: step =>
      step ? [trackedScreen("update", updateStepScreen(step, funnelProps))] : [],
  };
}
