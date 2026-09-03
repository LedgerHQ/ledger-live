import { useMemo } from "react";
import type { FeatureTourProps } from "@features/flow-pay-feature-tour";
import { track } from "~/renderer/analytics/segment";

export function usePayTabFeatureTour(): FeatureTourProps {
  return useMemo(
    () => ({
      onTrackScreen: (page: string) => track(page),
      onTrackEvent: (event: string, params: Record<string, unknown>) => track(event, params),
    }),
    [],
  );
}
