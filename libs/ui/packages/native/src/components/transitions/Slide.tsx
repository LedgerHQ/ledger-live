import React, { useState, useRef, useEffect, useMemo } from "react";
import { Animated, Platform, Dimensions } from "react-native";
import { TransitionProps } from "./types";

const WEB = Platform.OS === "web";

export interface SlideProps extends TransitionProps {
  /**
   * The direction of the slide animation.
   */
  direction?: "left" | "right";
}

/**
 * A slide left/right transition translating its children based on their status and a given direction.
 */
export function Slide({ status, duration, style, direction = "left", children }: SlideProps) {
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const styleRef = useRef(new Animated.Value(0)).current;
  const previousStatus = useRef<string | null>(null);

  useEffect(
    () => () => {
      previousStatus.current = status;
    },
    [status],
  );

  const animateIn = useMemo(
    () =>
      Animated.timing(styleRef, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    [duration, styleRef],
  );

  const animateOut = useMemo(
    () =>
      Animated.timing(styleRef, {
        toValue: direction === "left" ? -1 : 1,
        duration,
        useNativeDriver: true,
      }),
    [direction, duration, styleRef],
  );

  useEffect(() => {
    if (status === "entering") {
      if (previousStatus.current !== "exiting") {
        styleRef.setValue(direction === "left" ? 1 : -1);
      }
      animateIn.start();
    }
    if (status === "exiting") {
      animateOut.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              translateX: styleRef.interpolate({
                inputRange: [-1, 1],
                outputRange: WEB ? ["-100%", "100%"] : [-width, width],
              }),
            },
          ],
        },
        style,
      ]}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
    >
      {children}
    </Animated.View>
  );
}
