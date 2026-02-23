import React from "react";
import { animated } from "react-spring";

/**
 * Typed wrapper for react-spring's animated.div so it accepts children and style
 * with React 19 + styled-components typings.
 */
export const AnimatedDiv = animated.div as React.ComponentType<
  React.PropsWithChildren<{ style?: React.CSSProperties }>
>;
