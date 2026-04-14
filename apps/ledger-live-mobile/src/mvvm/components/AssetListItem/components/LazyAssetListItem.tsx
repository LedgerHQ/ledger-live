import React, { memo, useMemo } from "react";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Asset } from "~/types/asset";
import {
  computeAssetItemData,
  useAssetListSharedStateContext,
} from "../usePrecomputedAssetListData";
import AssetListItem from "./AssetListItem";

interface LazyAssetListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
  lx?: LumenViewStyle;
}

/**
 * Lazily computes its own display data via the shared-state context,
 * so only items actually rendered by FlashList pay the cost.
 */
const LazyAssetListItem: React.FC<LazyAssetListItemProps> = memo(({ asset, onPress, lx }) => {
  const sharedState = useAssetListSharedStateContext();
  const precomputed = useMemo(() => computeAssetItemData(asset, sharedState), [asset, sharedState]);
  return <AssetListItem asset={asset} onPress={onPress} precomputed={precomputed} lx={lx} />;
});
LazyAssetListItem.displayName = "LazyAssetListItem";

export default LazyAssetListItem;
