import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetList, AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import { Flex } from "@ledgerhq/native-ui";

export type AssetSelectionStepProps = {
  availableAssets: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

const AssetSelection = ({
  availableAssets,
  onAssetSelected,
}: Readonly<AssetSelectionStepProps>) => {
  const handleAssetClick = (asset: AssetType) => {
    const originalAsset = availableAssets.find(a => a.id === asset.id);
    if (originalAsset) {
      onAssetSelected(originalAsset);
    }
  };

  return (
    <Flex>
      <AssetList assets={availableAssets} onClick={handleAssetClick} />
    </Flex>
  );
};

export default React.memo(AssetSelection);
