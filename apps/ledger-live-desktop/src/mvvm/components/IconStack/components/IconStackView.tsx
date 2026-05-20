import React, { forwardRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { IconStackLayoutView } from "./IconStackLayoutView";
import { IconStackOverflowBadge } from "./IconStackOverflowBadge";
import type { IconStackLayoutProps } from "../types";
import type { IconStackLayoutStyles } from "../hooks/useIconStackLayoutViewModel";

type IconStackViewProps<T> = {
  readonly layoutProps: IconStackLayoutProps;
  readonly layoutStyles: IconStackLayoutStyles;
  readonly visibleItems: readonly T[];
  readonly displayedOverflowCount: number;
  readonly hasOverflowBadge: boolean;
  readonly tooltipContent: string;
  readonly overflowTestID?: string;
  readonly renderItem: (item: T) => React.ReactNode;
  readonly getItemKey: (item: T) => string;
};

function IconStackViewComponent<T>(
  {
    layoutProps,
    layoutStyles,
    visibleItems,
    displayedOverflowCount,
    hasOverflowBadge,
    tooltipContent,
    overflowTestID,
    renderItem,
    getItemKey,
  }: IconStackViewProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const hasTooltip = tooltipContent.length > 0;

  const stack = (
    <IconStackLayoutView
      ref={ref}
      layoutStyles={layoutStyles}
      {...layoutProps}
      {...(hasTooltip
        ? { tabIndex: 0, "aria-label": tooltipContent, role: "group" as const }
        : undefined)}
    >
      {visibleItems.map(item => (
        <React.Fragment key={getItemKey(item)}>{renderItem(item)}</React.Fragment>
      ))}
      {hasOverflowBadge ? (
        <React.Fragment key="overflow">
          <IconStackOverflowBadge count={displayedOverflowCount} testID={overflowTestID} />
        </React.Fragment>
      ) : null}
    </IconStackLayoutView>
  );

  if (!hasTooltip) {
    return stack;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{stack}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}

export const IconStackView = forwardRef(IconStackViewComponent) as <T>(
  props: IconStackViewProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null;
