import isEqual from "lodash/isEqual";
import { useEffect, useRef, memo } from "react";
import { trackPage } from "@shared/analytics";
import type { TrackScreenProps } from "./TrackScreen.types";

/**
 * Tracks an event named `Page ${category}${name ? " " + name : ""}` whenever
 * category, name, extra properties, refreshSource, or mandatory change.
 */
function TrackScreenComponent({
  category,
  name,
  refreshSource = true,
  mandatory = false,
  avoidDuplicates: _avoidDuplicates,
  ...props
}: TrackScreenProps): null {
  const lastTrackedRef = useRef<TrackedPagePayload | undefined>(undefined);

  useEffect(() => {
    const current: TrackedPagePayload = {
      category,
      name,
      props,
      refreshSource,
      mandatory,
    };
    if (isEqual(lastTrackedRef.current, current)) {
      return;
    }
    lastTrackedRef.current = current;

    trackPage({ category, name, props }, { updateRoutes: true, refreshSource, mandatory });
  }, [category, name, props, refreshSource, mandatory]);

  return null;
}

export const TrackScreen = memo(TrackScreenComponent);

type TrackedPagePayload = {
  category?: string;
  name?: string;
  props: Record<string, unknown>;
  refreshSource: boolean;
  mandatory: boolean;
};
