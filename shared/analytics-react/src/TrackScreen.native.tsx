import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { trackScreen } from "@shared/analytics";

export type TrackScreenProps = {
  category?: string;
  name?: string;
  /** Should the full screen name become the `source` of further screen events. */
  refreshSource?: boolean;
  /** Drop the event when the last screen event emitted was this same one. */
  avoidDuplicates?: boolean;
  /** Send the screen event even when standard analytics tracking is disabled. */
  mandatory?: boolean;
  [key: string]: unknown;
};

/**
 * On focus, tracks an event named `Page ${category}${name ? " " + name : ""}`. A screen that is
 * mounted but not focused tracks nothing.
 */
export function TrackScreen({
  category,
  name,
  refreshSource = true,
  avoidDuplicates = false,
  mandatory = false,
  ...properties
}: TrackScreenProps): null {
  const isFocused = useIsFocused();
  const wasFocusedRef = useRef<boolean>(false);

  useEffect(() => {
    if (wasFocusedRef.current === isFocused) return;
    wasFocusedRef.current = isFocused;
    if (isFocused) {
      trackScreen(category, name, properties, true, refreshSource, avoidDuplicates, mandatory);
    }
  }, [category, name, properties, isFocused, refreshSource, avoidDuplicates, mandatory]);

  return null;
}
