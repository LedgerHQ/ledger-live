import React, { forwardRef } from "react";
import { IconStackView } from "./components/IconStackView";
import { useIconStackLayoutViewModel } from "./hooks/useIconStackLayoutViewModel";
import { useIconStackViewModel } from "./hooks/useIconStackViewModel";
import type { IconStackProps } from "./types";

function IconStackComponent<T>(
  { renderItem, getItemKey, ...viewModelInput }: IconStackProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const viewModel = useIconStackViewModel(viewModelInput);
  const layoutStyles = useIconStackLayoutViewModel({
    size: viewModelInput.size,
    overlap: viewModelInput.overlap,
    borderWidth: viewModelInput.borderWidth,
    borderColor: viewModelInput.borderColor,
    borderRadius: viewModelInput.borderRadius,
  });

  return (
    <IconStackView
      ref={ref}
      {...viewModel}
      layoutStyles={layoutStyles}
      renderItem={renderItem}
      getItemKey={getItemKey}
    />
  );
}

export const IconStack = forwardRef(IconStackComponent) as <T>(
  props: IconStackProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null;

export type { IconStackProps, IconStackItemsViewModelParams } from "./types";
export {
  DEFAULT_MAX_OVERFLOW_DISPLAY,
  DEFAULT_MAX_VISIBLE_ICONS,
  sliceItemsForIconStackDisplay,
} from "./utils/sliceItemsForIconStackDisplay";
export type { IconStackDisplaySlice } from "./utils/sliceItemsForIconStackDisplay";
