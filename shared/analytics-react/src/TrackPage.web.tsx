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
 * On mount, tracks an event named `Page ${category}${name ? " " + name : ""}`. A page view belongs
 * to the mount: later prop changes never emit a second event, so render one `<TrackPage>` per page.
 */
const TrackPageComponent = ({
  category,
  name,
  refreshSource = true,
  mandatory = false,
  ...props
}: TrackPageProps): null => {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;

      trackPage({ category, name, props }, { updateRoutes: true, refreshSource, mandatory });
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const TrackPage = memo(TrackPageComponent);
