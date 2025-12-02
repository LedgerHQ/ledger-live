import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { AssetItem } from "./AssetItem";
import { useFilteredAssets } from "../../hooks/useFilteredAssets";

type AssetListProps = {
  searchQuery: string;
  onAssetSelect: (assetId: string) => void;
};

export const AssetList = ({ searchQuery, onAssetSelect }: AssetListProps) => {
  const assets = useFilteredAssets(searchQuery);

  return (
    <Flex flexDirection="column" rowGap={2}>
      {assets.map(asset => (
        <AssetItem key={asset.id} asset={asset} onClick={() => onAssetSelect(asset.id)} />
      ))}
    </Flex>
  );
};
