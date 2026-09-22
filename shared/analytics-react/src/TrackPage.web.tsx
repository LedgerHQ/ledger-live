import isEqual from "lodash/isEqual";
import { useEffect, useRef, memo } from "react";
import { trackPage } from "@shared/analytics";

export type TrackPageProps = {
  category: string /** First part of the event name string. */;
  name?: string /** Second part of the event name.  */;
  refreshSource?: boolean /** Should the full page name become the `source` of further page events. */;
  mandatory?: boolean /** Send the page event even when standard analytics tracking is disabled. */;
  [key: string]: unknown;
};

/**
 * Tracks an event named `Page ${category}${name ? " " + name : ""}` whenever
 * category, name, extra properties, refreshSource, or mandatory change.
 */
const TrackPageComponent = ({
  category,
  name,
  refreshSource = true,
  mandatory = false,
  ...props
}: TrackPageProps): null => {
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
};

export const TrackPage = memo(TrackPageComponent);

type TrackedPagePayload = {
  category: string;
  name?: string;
  props: Record<string, unknown>;
  refreshSource: boolean;
  mandatory: boolean;
};
