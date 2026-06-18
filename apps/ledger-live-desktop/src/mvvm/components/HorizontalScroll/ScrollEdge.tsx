import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { ChevronLeft, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

type ScrollEdgeProps = {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
  readonly ariaLabelKey?: string;
  readonly hideGradient?: boolean;
};

const config = {
  left: {
    icon: ChevronLeft,
    defaultAriaLabelKey: "common.scrollLeft",
    className: "left-0 pl-8",
    gradientClassName: "left-0 bg-gradient-to-r from-gradient-100 to-gradient-0",
  },
  right: {
    icon: ChevronRight,
    defaultAriaLabelKey: "common.scrollRight",
    className: "right-0 pr-8",
    gradientClassName: "right-0 bg-gradient-to-l from-gradient-100 to-gradient-0",
  },
} as const;

export const ScrollEdge = ({ direction, onClick, ariaLabelKey, hideGradient }: ScrollEdgeProps) => {
  const { t } = useTranslation();
  const { icon, defaultAriaLabelKey, className, gradientClassName } = config[direction];

  return (
    <div
      className={cn("absolute inset-y-0 z-10 flex items-center", className)}
      data-testid={`scroll-arrow-${direction}`}
    >
      {!hideGradient && (
        <div className={cn("pointer-events-none absolute inset-y-0 w-48", gradientClassName)} />
      )}
      <div className="relative opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton
          icon={icon}
          size="sm"
          appearance="gray"
          aria-label={t(ariaLabelKey ?? defaultAriaLabelKey)}
          onClick={onClick}
        />
      </div>
    </div>
  );
};
