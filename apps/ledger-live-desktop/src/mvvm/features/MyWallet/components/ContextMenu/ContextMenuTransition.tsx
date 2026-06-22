import React, { useEffect, useRef } from "react";
import { cn } from "LLD/utils/cn";
import type { ContextMenuView, NavDirection } from "./types";

type ContextMenuTransitionProps = {
  view: ContextMenuView;
  direction: NavDirection;
  children: React.ReactNode;
};

export function ContextMenuTransition({
  view,
  direction,
  children,
}: Readonly<ContextMenuTransitionProps>) {
  const prevViewRef = useRef(view);
  const shouldAnimate = prevViewRef.current !== view;

  useEffect(() => {
    prevViewRef.current = view;
  }, [view]);

  return (
    <div
      key={view}
      className={cn(
        "flex flex-col",
        shouldAnimate &&
          (direction === "forward" ? "animate-slide-in-from-right" : "animate-slide-in-from-left"),
      )}
    >
      {children}
    </div>
  );
}
