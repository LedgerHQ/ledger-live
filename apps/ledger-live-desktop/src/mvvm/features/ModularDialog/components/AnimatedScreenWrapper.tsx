import React from "react";
import type { ModularDrawerAddAccountStep } from "../../AddAccountDrawer/domain";
import type { ModularDialogStep, NavigationDirection } from "../types";
import { cn } from "LLD/utils/cn";

const AnimatedScreenWrapper = ({
  children,
  fillAvailableHeight = false,
  screenKey,
  direction,
}: {
  children: React.ReactNode;
  fillAvailableHeight?: boolean;
  screenKey: ModularDialogStep | ModularDrawerAddAccountStep;
  direction: NavigationDirection;
}) => {
  return (
    <div
      className={cn(
        "scrollbar-none flex w-full flex-col overflow-hidden",
        fillAvailableHeight ? "min-h-0 flex-1" : "h-[450px]",
        direction === "FORWARD" ? "animate-slide-in-from-right" : "animate-slide-in-from-left",
      )}
      data-testid={`modular-dialog-screen-${screenKey}`}
    >
      {children}
    </div>
  );
};

export default AnimatedScreenWrapper;
