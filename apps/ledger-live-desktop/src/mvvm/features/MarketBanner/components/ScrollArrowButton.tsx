import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { ChevronLeft, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

type ScrollArrowButtonProps = {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
};

const config = {
  left: {
    icon: ChevronLeft,
    translationKey: "marketBanner.scrollLeft",
    className: "left-0 pl-8",
    gradientClassName: "left-0 bg-gradient-to-r from-gradient-70 via-gradient-0",
  },
  right: {
    icon: ChevronRight,
    translationKey: "marketBanner.scrollRight",
    className: "right-0 pr-8",
    gradientClassName: "right-0 bg-gradient-to-l from-gradient-70 via-gradient-0",
  },
} as const;

export const ScrollArrowButton = ({ direction, onClick }: ScrollArrowButtonProps) => {
  const { t } = useTranslation();
  const { icon, translationKey, className, gradientClassName } = config[direction];

  return (
    <div
      className={cn(
        "absolute inset-y-0 z-10 flex items-center opacity-0 transition-opacity group-hover:opacity-100",
        className,
      )}
      data-testid={`scroll-arrow-${direction}`}
    >
      <div className={cn("pointer-events-none absolute inset-y-0 w-48", gradientClassName)} />
      <div className="relative">
        <IconButton
          icon={icon}
          size="sm"
          appearance="gray"
          aria-label={t(translationKey)}
          onClick={onClick}
        />
      </div>
    </div>
  );
};
