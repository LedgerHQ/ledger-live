import { motion } from "framer-motion";
import React from "react";
import type { ModularDrawerAddAccountStep } from "../../AddAccountDrawer/domain";
import type { ModularDrawerStep, NavigationDirection } from "../types";

const AnimatedScreenWrapper = ({
  children,
  screenKey,
  direction,
  ...props
}: {
  children: React.ReactNode;
  screenKey: ModularDrawerStep | ModularDrawerAddAccountStep;
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
        width: "100%",
        overflow: "hidden",
        height: `480px`,
        scrollbarWidth: "none",
      }}
      data-testid={`modular-drawer-screen-${screenKey}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedScreenWrapper;
