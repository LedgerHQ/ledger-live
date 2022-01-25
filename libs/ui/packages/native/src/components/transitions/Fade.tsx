import React, { useRef, useMemo, useEffect } from "react";
import { Animated } from "react-native";
import { TransitionProps } from "./types";

/**
 * A fade-in / fade-out transition changing the opacity of its children based on their status.
 */
export function Fade({ status, duration, style, children }: TransitionProps) {
  const fadeAnim = useRef(new Animated.Value(status === "entered" ? 1 : 0)).current;

  const fadeIn = useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    [duration, fadeAnim],
  );

  const fadeOut = useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    [duration, fadeAnim],
  );

  useEffect(() => {
    if (status === "entering") {
      fadeIn.start();
    }
    if (status === "exiting") {
      fadeOut.start();
    }
  }, [fadeIn, fadeOut, status]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
