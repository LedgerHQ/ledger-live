import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { screen } from "./segment";

type Props = {
  [key: string]: unknown;
} & {
  category?: string;
  name?: string;
  refreshSource?: boolean;
  avoidDuplicates?: boolean;
  mandatory?: boolean;
};

export default function TrackScreen({
  category,
  name,
  refreshSource = true,
  avoidDuplicates = false,
  mandatory = false,
  ...props
}: Props) {
  const isFocused = useIsFocused();
  const isFocusedRef = useRef<boolean>();

  // Analytics tracking
  useEffect(() => {
    if (isFocusedRef.current !== isFocused) {
      isFocusedRef.current = isFocused;
      if (isFocusedRef.current) {
        screen(category, name, props, true, refreshSource, avoidDuplicates, mandatory);
      }
    }
  }, [category, name, props, isFocused, refreshSource, avoidDuplicates, mandatory]);

  return null;
}
