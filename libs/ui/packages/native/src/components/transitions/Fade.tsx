import React, { useRef, useMemo, useEffect, useState } from "react";
import { Animated } from "react-native";
import { TransitionProps } from "./types";

export interface FadeProps extends TransitionProps {
  /**
   * Delay before starting the transition.
   */
  delay?: number;
}

/**
 * A fade-in / fade-out transition changing the opacity of its children based on their status.
 */
export function Fade({ status, delay = 0, duration, style, children }: FadeProps) {
  const [visible, setVisible] = useState(status === "exiting");
  const fadeAnim = useRef(
    new Animated.Value(["entered", "exiting"].includes(status) ? 1 : 0),
  ).current;

  const fadeIn = useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration,
        useNativeDriver: true,
      }),
    [duration, delay, fadeAnim],
  );

  const fadeOut = useMemo(
    () =>
      Animated.timing(fadeAnim, {
        toValue: 0,
        delay,
        duration,
        useNativeDriver: true,
      }),
    [duration, delay, fadeAnim],
  );

  useEffect(() => {
    let dead = false;
    if (status === "entering") {
      fadeIn.start(() => {
        if (dead) return;
        setVisible(true);
      });
    }
    if (status === "exiting") {
      fadeOut.start(() => {
        if (dead) return;
        setVisible(false);
      });
    }
    return () => {
      dead = true;
    };
  }, [fadeIn, fadeOut, status, setVisible]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"} // touches pass through if it's invisible
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
