import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { FlatList } from "react-native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";

export type AssetSelectionStepProps = {
  availableAssets: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

// TODO: This component will be replaced with AssetList from pre-ldls

const AssetList: React.FC<{
  assets: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
}> = ({ assets, onAssetSelected }) => {
  return (
    <FlatList
      data={assets}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Flex height={40} alignItems="center" justifyContent="center">
          <TouchableOpacity onPress={() => onAssetSelected?.(item)}>
            <Text color="neutral.c100">
              {item.name} ({item.ticker})
            </Text>
          </TouchableOpacity>
        </Flex>
      )}
      ItemSeparatorComponent={() => <Box height={1} bg="neutral.c50" mx={2} />}
    />
  );
};

const AssetSelection = ({
  availableAssets,
  onAssetSelected,
}: Readonly<AssetSelectionStepProps>) => {
  return <AssetList assets={availableAssets} onAssetSelected={onAssetSelected} />;
};

export default React.memo(AssetSelection);
