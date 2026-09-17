import { useEffect, useRef, memo } from "react";
import { trackPage } from "@shared/analytics";

export type TrackPageProps = {
  category: string /** First part of the event name string. */;
  name?: string /** Second part of the event name.  */;
  refreshSource?: boolean /** Should the full page name become the `source` of further page events. */;
  mandatory?: boolean /** Send the page event even when standard analytics tracking is disabled. */;
  [key: string]: unknown;
};

function getPagePropertiesKey(properties: Record<string, unknown>): string {
  try {
    return JSON.stringify(properties);
  } catch {
    return "";
  }
}

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
  const propertiesKey = getPagePropertiesKey(props);
  const lastSignatureRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const signature = `${category}|${name ?? ""}|${propertiesKey}|${refreshSource}|${mandatory}`;
    if (lastSignatureRef.current === signature) {
      return;
    }
    lastSignatureRef.current = signature;

    trackPage({ category, name, props }, { updateRoutes: true, refreshSource, mandatory });
  }, [category, name, propertiesKey, refreshSource, mandatory]);

  return null;
};

export const TrackPage = memo(TrackPageComponent);
