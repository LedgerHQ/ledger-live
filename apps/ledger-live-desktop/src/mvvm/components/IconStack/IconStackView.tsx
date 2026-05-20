import React from "react";
import { OverflowBadge } from "./components/OverflowBadge";
import { LayoutView } from "./components/LayoutView";
import { TooltipWrapper } from "./components/TooltipWrapper";
import type { IconStackViewProps } from "./types";

export function IconStackView<T>({
  layoutStyles,
  testID,
  className,
  visibleItems,
  displayedOverflowCount,
  hasOverflowBadge,
  tooltipContent,
  overflowTestID,
  renderItem,
  getItemKey,
  forwardedRef,
}: IconStackViewProps<T>) {
  const hasTooltip = tooltipContent.length > 0;
  const accessibilityProps: Pick<
    React.HTMLAttributes<HTMLDivElement>,
    "tabIndex" | "aria-label" | "role"
  > = hasTooltip ? { tabIndex: 0, "aria-label": tooltipContent, role: "group" } : {};

  return (
    <TooltipWrapper tooltipContent={tooltipContent}>
      <LayoutView
        ref={forwardedRef}
        layoutStyles={layoutStyles}
        testID={testID}
        className={className}
        {...accessibilityProps}
      >
        {visibleItems.map(item => (
          <React.Fragment key={getItemKey(item)}>{renderItem(item)}</React.Fragment>
        ))}
        {hasOverflowBadge ? (
          <React.Fragment key="overflow">
            <OverflowBadge count={displayedOverflowCount} testID={overflowTestID} />
          </React.Fragment>
        ) : null}
      </LayoutView>
    </TooltipWrapper>
  );
}
