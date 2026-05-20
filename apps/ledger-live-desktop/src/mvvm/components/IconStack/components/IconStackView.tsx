import React, { forwardRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { IconStackLayoutView } from "./IconStackLayoutView";
import { IconStackOverflowBadge } from "./IconStackOverflowBadge";
import type { IconStackLayoutProps } from "../types";
import type { useIconStackLayoutViewModel } from "../hooks/useIconStackLayoutViewModel";

type IconStackLayoutStyles = ReturnType<typeof useIconStackLayoutViewModel>;

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
  const stack = (
    <IconStackLayoutView ref={ref} layoutStyles={layoutStyles} {...layoutProps}>
      {visibleItems.map(item => (
        <React.Fragment key={getItemKey(item)}>{renderItem(item)}</React.Fragment>
      ))}
      {hasOverflowBadge ? (
        <IconStackOverflowBadge count={displayedOverflowCount} testID={overflowTestID} />
      ) : null}
    </IconStackLayoutView>
  );

  if (!tooltipContent) {
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
