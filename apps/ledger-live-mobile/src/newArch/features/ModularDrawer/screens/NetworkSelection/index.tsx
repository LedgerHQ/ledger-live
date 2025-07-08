import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { FlatList } from "react-native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";

export type NetworkSelectionStepProps = {
  networksToDisplay?: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
};

// TODO: This component will be replaced with NetworkList from pre-ldls

const NetworkList: React.FC<{
  networks?: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
}> = ({ networks, onNetworkSelected }) => {
  return (
    <FlatList
      data={networks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Flex height={40} alignItems="center" justifyContent="center">
          <TouchableOpacity onPress={() => onNetworkSelected?.(item)}>
            <Text color="neutral.c100">
              {"Network =>"} {item.name} ({item.ticker})
            </Text>
          </TouchableOpacity>
        </Flex>
      )}
      ItemSeparatorComponent={() => <Box height={1} bg="neutral.c50" mx={2} />}
    />
  );
};

const NetworkSelection = ({
  networksToDisplay,
  onNetworkSelected,
}: Readonly<NetworkSelectionStepProps>) => {
  return <NetworkList networks={networksToDisplay} onNetworkSelected={onNetworkSelected} />;
};

export default React.memo(NetworkSelection);
