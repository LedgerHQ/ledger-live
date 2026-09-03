import React, { useCallback, useMemo } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { partitionByAvailability } from "@ledgerhq/live-common/modularDrawer/utils/partitionByAvailability";
import { AssetListItem } from "../AssetListItem";
import { AssetType } from "../../../../types";
import {
  UNAVAILABLE_SECTION_HEADER_HEIGHT,
  UnavailableSectionHeader,
} from "LLD/features/ModularDialog/components/UnavailableSectionHeader";

type AssetListRow = { kind: "asset"; asset: AssetType } | { kind: "unavailableSectionHeader" };

type AssetVirtualListProps = {
  assets: AssetType[];
  onClick: (asset: AssetType) => void;
  onVisibleItemsScrollEnd?: () => void;
  scrollToTop?: boolean;
  hasNextPage?: boolean;
  isDebuggingDuplicates?: boolean;
  fillAvailableHeight?: boolean;
};

export const AssetVirtualList = ({
  assets,
  onClick,
  onVisibleItemsScrollEnd,
  scrollToTop,
  hasNextPage,
  isDebuggingDuplicates,
  fillAvailableHeight,
}: AssetVirtualListProps) => {
  const rows = useMemo<AssetListRow[]>(() => {
    const { available, unavailable } = partitionByAvailability(assets, asset => !!asset.disabled);
    const availableRows: AssetListRow[] = available.map(asset => ({ kind: "asset", asset }));

    if (unavailable.length === 0) return availableRows;

    return [
      ...availableRows,
      { kind: "unavailableSectionHeader" },
      ...unavailable.map(asset => ({ kind: "asset" as const, asset })),
    ];
  }, [assets]);

  const renderAssetItem = useCallback(
    (row: AssetListRow) =>
      row.kind === "unavailableSectionHeader" ? (
        <UnavailableSectionHeader testId="asset-selector-unavailable-assets-header" />
      ) : (
        <AssetListItem {...row.asset} shouldDisplayId={isDebuggingDuplicates} onClick={onClick} />
      ),
    [onClick, isDebuggingDuplicates],
  );

  const getItemHeight = useCallback(
    (row: AssetListRow) =>
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
