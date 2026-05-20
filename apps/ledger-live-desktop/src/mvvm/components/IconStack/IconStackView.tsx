import React from "react";
import { LayoutItems } from "./components/LayoutItems";
import { LayoutView } from "./components/LayoutView";
import { TooltipWrapper } from "./components/TooltipWrapper";
import type { IconStackViewProps } from "./types";

export function IconStackView<T>({
  layoutProps,
  layoutStyles,
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
        {...layoutProps}
        {...accessibilityProps}
      >
        <LayoutItems
          visibleItems={visibleItems}
          displayedOverflowCount={displayedOverflowCount}
          hasOverflowBadge={hasOverflowBadge}
          overflowTestID={overflowTestID}
          renderItem={renderItem}
          getItemKey={getItemKey}
        />
      </LayoutView>
    </TooltipWrapper>
  );
}
