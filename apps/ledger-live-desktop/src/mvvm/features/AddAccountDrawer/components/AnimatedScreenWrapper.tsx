import { motion } from "framer-motion";
import React from "react";
import type { ModularDrawerAddAccountStep } from "../domain";

export const NAVIGATION_DIRECTION = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
} as const;

export type NavigationDirection = (typeof NAVIGATION_DIRECTION)[keyof typeof NAVIGATION_DIRECTION];

const TOP_BAR = 62;

const AnimatedScreenWrapper = ({
  children,
  screenKey,
  direction,
  ...props
}: {
  children: React.ReactNode;
  screenKey: ModularDrawerAddAccountStep;
  direction: NavigationDirection;
}) => {
  const variants = {
    enter: (direction: NavigationDirection) => ({
      x: direction === "FORWARD" ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: NavigationDirection) => ({
      x: direction === "FORWARD" ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      key={screenKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.3, 0, 0.3, 1] }}
      style={{
        position: "absolute",
        width: "100%",
        overflow: "hidden",
        height: `calc(100% - ${TOP_BAR}px)`,
        scrollbarWidth: "none",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
      data-testid={`modular-drawer-screen-${screenKey}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedScreenWrapper;
