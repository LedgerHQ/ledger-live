import { useMemo } from "react";
import { track, trackPage } from "@shared/analytics";
import {
  buildStakePositionButtonEvent,
  buildStakePositionPageEvent,
  type StakePositionTrackedButton,
  type StakePositionTrackedPage,
  type StakePositionTrackedStep,
  type StakePositionTrackingContext,
} from "../analytics/stakePositionEvents";
import type { StakePositionExitAction } from "../types";

export type StakePositionTracking = Readonly<{
  trackStep: (step: StakePositionTrackedStep) => void;
  trackButton: (
    button: StakePositionTrackedButton,
    page: StakePositionTrackedPage,
    action?: StakePositionExitAction,
  ) => void;
}>;

/**
 * Page and button events of the surface. The transaction itself is the host's to report: its
 * lifecycle seam sends `tx_intent` and `tx_terminal`, plus one Segment completion event.
 */
export function useStakePositionTracking({
  origin,
  ticker,
}: StakePositionTrackingContext): StakePositionTracking {
  return useMemo(() => {
    const context = { origin, ticker };
    return {
      trackStep: step => {
        void trackPage(buildStakePositionPageEvent(context, step));
      },
      trackButton: (button, page, action) => {
        const { event, props } = buildStakePositionButtonEvent(context, button, page, action);
        void track(event, props);
      },
    };
  }, [origin, ticker]);
}
