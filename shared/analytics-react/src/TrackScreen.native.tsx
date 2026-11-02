import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { trackPage } from "@shared/analytics";
import type { TrackScreenProps } from "./TrackScreen.types";

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
  ...props
}: TrackScreenProps): null {
  const isFocused = useIsFocused();
  const wasFocusedRef = useRef<boolean>(false);

  useEffect(() => {
    if (wasFocusedRef.current === isFocused) return;
    wasFocusedRef.current = isFocused;
    if (isFocused) {
      trackPage(
        { category, name, props },
        { updateRoutes: true, refreshSource, avoidDuplicates, mandatory },
      );
    }
  }, [category, name, props, isFocused, refreshSource, avoidDuplicates, mandatory]);

  return null;
}
