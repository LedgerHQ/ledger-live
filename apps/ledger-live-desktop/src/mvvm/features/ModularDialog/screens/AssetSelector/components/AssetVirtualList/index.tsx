import React, { useCallback } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { useAvailabilityRows } from "@ledgerhq/live-common/modularDrawer/hooks/useAvailabilityRows";
import type { AvailabilityRow } from "@ledgerhq/live-common/modularDrawer/utils/buildAvailabilityRows";
import { AssetListItem } from "../AssetListItem";
import { AssetType } from "../../../../types";
import {
  UNAVAILABLE_SECTION_HEADER_HEIGHT,
  UnavailableSectionHeader,
} from "LLD/features/ModularDialog/components/UnavailableSectionHeader";

type AssetVirtualListProps = {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
  hasNextPage?: boolean;
  isDebuggingDuplicates?: boolean;
  fillAvailableHeight?: boolean;
};

const isUnavailableAsset = (asset: AssetType) => !!asset.disabled;

export const AssetVirtualList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
  hasNextPage,
  isDebuggingDuplicates,
  fillAvailableHeight,
}: AssetVirtualListProps) => {
  const rows = useAvailabilityRows(assets, isUnavailableAsset);

  const renderAssetItem = useCallback(
    (row: AvailabilityRow<AssetType>) =>
      row.kind === "unavailableSectionHeader" ? (
        <UnavailableSectionHeader testId="asset-selector-unavailable-assets-header" />
      ) : (
        <AssetListItem {...row.item} shouldDisplayId={isDebuggingDuplicates} onClick={onClick} />
      ),
    [onClick, isDebuggingDuplicates],
  );

  const getItemHeight = useCallback(
    (row: AvailabilityRow<AssetType>) =>
      row.kind === "unavailableSectionHeader" ? UNAVAILABLE_SECTION_HEADER_HEIGHT : undefined,
    [],
  );

  return (
    <VirtualList
      itemHeight={64}
      getItemHeight={getItemHeight}
      items={rows}
      onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      renderItem={renderAssetItem}
      scrollToTop={scrollToTop}
      hasNextPage={hasNextPage}
      testId="asset-selector-list-container"
      className={fillAvailableHeight ? "h-auto min-h-0 flex-1 pb-80" : "pb-80"}
    />
  );
};
