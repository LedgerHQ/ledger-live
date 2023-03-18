import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { screen } from "./segment";

import { previousRouteNameRef, currentRouteNameRef } from "./screenRefs";

type Props = {
  [key: string]: unknown;
} & {
  category?: string;
  name?: string;
  refreshSource?: boolean;
};

export default function TrackScreen({
  category,
  name,
  refreshSource = true,
  ...props
}: Props) {
  const isFocused = useIsFocused();
  const isFocusedRef = useRef<boolean>();

  // Analytics tracking
  useEffect(() => {
    if (isFocusedRef.current !== isFocused) {
      isFocusedRef.current = isFocused;
      if (isFocusedRef.current) {
        if (refreshSource) {
          previousRouteNameRef.current = currentRouteNameRef.current;
          currentRouteNameRef.current = `${
            category + (name ? ` ${name}` : "")
          }`;
        } else {
          previousRouteNameRef.current = currentRouteNameRef.current;
        }
        screen(category, name, props);
      }
    }
  }, [category, name, props, isFocused, refreshSource]);

  return null;
}
