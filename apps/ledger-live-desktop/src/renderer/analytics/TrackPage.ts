import { memo, useEffect } from "react";
import { trackPage } from "./segment";
import { currentRouteNameRef } from "./screenRefs";

export const setTrackingSource = (s?: string) => {
  currentRouteNameRef.current = s;
};

type Props = {
  /**
   * First part of the event name string
   */
  category: string;
  /**
   * Second part of the event name string, will be concatenated to `category`
   * after a whitespace if defined.
   */
  name?: string;
  /**
   * Should this update the current route name.
   * If true, it means that the full page name (`category` + " " + `name`) will
   * be used as a "source" property for further page events.
   * NB: the previous parameter `updateRoutes` must be true for this to have
   * any effect.
   *
   * An example of a place where this should be false is inside a drawer that
   * is rendered on top of a page that has its own <TrackPage /> so the drawer
   * name should not override the "source".
   */
  refreshSource?: boolean;
  [key: string]: unknown;
};

/**
 * On mount, this component will track an event which will have the name
 * `Page ${category}${name ? " " + name : ""}`.
 */
const TrackPage: React.FC<Props> = ({ category, name, refreshSource = true, ...properties }) => {
  useEffect(() => {
    trackPage(category, name, properties, true, refreshSource);
  }, [category, name, properties, refreshSource]);
  return null;
};

export default memo(TrackPage);
