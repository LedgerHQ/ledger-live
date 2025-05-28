import React from "react";
import { motion } from "framer-motion";
import type { ModularDrawerStep, NavigationDirection } from "../types";

const ROW_HEIGHT = 64;
const TWO_ROWS_HEIGHT = ROW_HEIGHT;
const INPUT_HEIGHT = 40;
const SPACING = 16;
const EXTRA_BOTTOM_MARGIN = TWO_ROWS_HEIGHT + INPUT_HEIGHT + SPACING;

const AnimatedScreenWrapper = ({
  children,
  screenKey,
  direction,
}: {
  children: React.ReactNode;
  screenKey: ModularDrawerStep;
  direction: NavigationDirection;
}) => (
  <motion.div
    key={screenKey}
    initial={{ x: direction === "FORWARD" ? 100 : -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
    exit={{
      x: direction === "FORWARD" ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" },
    }}
    style={{
      position: "absolute",
      width: "100%",
      paddingRight: "32px",
      overflow: "hidden",
      height: `calc(100vh - ${EXTRA_BOTTOM_MARGIN}px)`,
    }}
  >
    {children}
  </motion.div>
);

export default AnimatedScreenWrapper;
