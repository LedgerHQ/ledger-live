import React from "react";
import { IconStackView } from "./components/IconStackView";
import { useIconStackLayoutViewModel } from "./hooks/useIconStackLayoutViewModel";
import { useIconStackViewModel } from "./hooks/useIconStackViewModel";
import type { IconStackProps } from "./types";

export function IconStack<T>(
  props: IconStackProps<T> & React.RefAttributes<HTMLDivElement>,
): React.ReactElement | null {
  const { renderItem, getItemKey, ref, ...viewModelInput } = props;
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

export type { IconStackProps, IconStackItemsViewModelParams } from "./types";
export {
  DEFAULT_MAX_OVERFLOW_DISPLAY,
  DEFAULT_MAX_VISIBLE_ICONS,
  sliceItemsForIconStackDisplay,
} from "./utils/sliceItemsForIconStackDisplay";
export type { IconStackDisplaySlice } from "./utils/sliceItemsForIconStackDisplay";
