import { memo, useEffect } from "react";
import { trackPage } from "./segment";

let source: string | undefined | null;
/**
 * @deprecated
 */
export const setTrackingSource = (s?: string) => {
  source = s;
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
   *
   * @deprecated
   * just disable this and the "source" property of further screens will be
   * automatically set to the value of the previous screen visited.
   * */
  enableDeprecatedSourceTracking?: boolean;
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
const TrackPage: React.FC<Props> = ({
  category,
  name,
  enableDeprecatedSourceTracking = false,
  refreshSource = true,
  ...properties
}) => {
  useEffect(() => {
    if (enableDeprecatedSourceTracking) {
      trackPage(category, name, {
        ...properties,
        ...(source
          ? {
              source,
            }
          : {}),
      });
      // reset source param once it has been tracked to not repeat it from further unrelated navigation
      source = null;
    } else {
      trackPage(category, name, properties, true, refreshSource);
    }
    // should only happen on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default memo(TrackPage);
