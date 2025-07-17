import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Text } from "react-native";

export type AssetSelectionStepProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
};

const AssetSelection = ({ assetsToDisplay }: Readonly<AssetSelectionStepProps>) => {
  return (
    <>
      {assetsToDisplay.forEach(asset => {
        return (
          <Text key={asset.id} style={{ margin: 10 }}>
            {asset.name} ({asset.ticker})
          </Text>
        );
      })}
    </>
  );
};

export default React.memo(AssetSelection);
