// @flow
import { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { screen } from "./segment";

type Props = {
  category: string,
  name?: string,
};

export default function TrackScreen({ category, name, ...props }: Props) {
  const isFocused = useIsFocused();

  const isFocusedRef = useRef(isFocused);

  useEffect(() => {
    if (isFocusedRef.current !== isFocused) {
      isFocusedRef.current = isFocused;
      screen(category, name, props);
    }
  }, [category, name, props, isFocused]);

  return null;
}
