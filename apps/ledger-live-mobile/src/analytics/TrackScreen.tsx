import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
// eslint-disable-next-line import/no-cycle
import { screen } from "./segment";

import { previousRouteNameRef, currentRouteNameRef } from "./screenRefs";

type Props = {
  [key: string]: unknown;
} & {
  category?: string;
  name?: string;
};

export default function TrackScreen({ category, name, ...props }: Props) {
  const isFocused = useIsFocused();
  const isFocusedRef = useRef<boolean>();

  // Analytics tracking
  useEffect(() => {
    if (isFocusedRef.current !== isFocused) {
      isFocusedRef.current = isFocused;
      if (isFocusedRef.current) {
        previousRouteNameRef.current = currentRouteNameRef.current;
        currentRouteNameRef.current = `${category + (name ? ` ${name}` : "")}`;
        screen(category, name, props);
      }
    }
  }, [category, name, props, isFocused]);

  return null;
}
