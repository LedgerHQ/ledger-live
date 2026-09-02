import { memo, useEffect, useRef } from "react";
import { trackPage } from "@shared/analytics";

export type TrackPageProps = {
  /** First part of the event name string. */
  category: string;
  /**
   * Second part of the event name string, concatenated to `category` after a whitespace if
   * defined.
   */
  name?: string;
  /**
   * Should the full page name become the `source` of further page events. Set this to false inside
   * a drawer rendered on top of a page that has its own `<TrackPage>`, so the drawer name does not
   * override the source.
   */
  refreshSource?: boolean;
  /** Send the page event even when standard analytics tracking is disabled. */
  mandatory?: boolean;
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
  ...properties
}: TrackPageProps): null => {
  // Read through a ref so re-renders cannot re-run the effect. `properties` is a fresh rest-object
  // on every render, so as a dependency it would emit a duplicate page event whenever any prop
  // changed — and the duplicate would take the page as its own source.
  const latestRef = useRef({ category, name, properties, refreshSource, mandatory });
  latestRef.current = { category, name, properties, refreshSource, mandatory };

  useEffect(() => {
    const { category, name, properties, refreshSource, mandatory } = latestRef.current;
    trackPage(category, name, properties, true, refreshSource, mandatory);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const TrackPage = memo(TrackPageComponent);
