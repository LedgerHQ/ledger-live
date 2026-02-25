import React from "react";
import type { ModularDrawerAddAccountStep } from "../../AddAccountDrawer/domain";
import type { ModularDialogStep, NavigationDirection } from "../types";
import { cn } from "LLD/utils/cn";

const AnimatedScreenWrapper = ({
  children,
  screenKey,
  direction,
}: {
  children: React.ReactNode;
  screenKey: ModularDialogStep | ModularDrawerAddAccountStep;
  direction: NavigationDirection;
}) => {
  return (
    <div
      className={cn(
        "scrollbar-none flex h-[450px] w-full flex-col overflow-hidden",
        direction === "FORWARD" ? "animate-slide-in-from-right" : "animate-slide-in-from-left",
      )}
      data-testid={`modular-dialog-screen-${screenKey}`}
    >
      {children}
    </div>
  );
};

export default AnimatedScreenWrapper;
