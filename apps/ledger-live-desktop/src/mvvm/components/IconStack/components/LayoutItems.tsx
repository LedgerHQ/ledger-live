import React from "react";
import { OverflowBadge } from "./OverflowBadge";
import type { IconStackViewProps } from "../types";

type LayoutItemsProps<T> = Pick<
  IconStackViewProps<T>,
  | "visibleItems"
  | "displayedOverflowCount"
  | "hasOverflowBadge"
  | "overflowTestID"
  | "renderItem"
  | "getItemKey"
>;

export function LayoutItems<T>({
  visibleItems,
  displayedOverflowCount,
  hasOverflowBadge,
  overflowTestID,
  renderItem,
  getItemKey,
}: LayoutItemsProps<T>) {
  return (
    <>
      {visibleItems.map(item => (
        <React.Fragment key={getItemKey(item)}>{renderItem(item)}</React.Fragment>
      ))}
      {hasOverflowBadge ? (
        <React.Fragment key="overflow">
          <OverflowBadge count={displayedOverflowCount} testID={overflowTestID} />
        </React.Fragment>
      ) : null}
    </>
  );
}
