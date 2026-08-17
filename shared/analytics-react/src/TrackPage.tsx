import { memo, useEffect } from "react";
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

/** On mount, tracks an event named `Page ${category}${name ? " " + name : ""}`. */
const TrackPageComponent = ({
  category,
  name,
  refreshSource = true,
  mandatory = false,
  ...properties
}: TrackPageProps): null => {
  useEffect(() => {
    trackPage(category, name, properties, true, refreshSource, mandatory);
  }, [category, name, properties, refreshSource, mandatory]);

  return null;
};

export const TrackPage = memo(TrackPageComponent);
