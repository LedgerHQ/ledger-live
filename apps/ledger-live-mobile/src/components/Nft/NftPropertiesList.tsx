import React from "react";
import { FlatList, FlatListProps } from "react-native";
import { Flex, Text, Box } from "@ledgerhq/native-ui";
import { NFTMetadata } from "@ledgerhq/types-live";

const renderItem = ({ item }: { item: NFTMetadata["properties"][number] }) => (
  <Flex
    py={3}
    px={4}
    borderRadius={1}
    borderWidth={"1px"}
    borderColor={"neutral.c30"}
  >
    <Text variant={"subtitle"} uppercase color={"primary.c80"}>
      {item.key}
    </Text>
    <Text variant={"bodyLineHeight"} color={"neutral.c100"}>
      {item.value}
    </Text>
  </Flex>
);

const keyExtractor = (item: Record<"key" | "value", string>) => item.key;

export default function NftPropertiesList({
  data,
}: Pick<FlatListProps<NFTMetadata["properties"][number]>, "data">) {
  return (
    <FlatList<NFTMetadata["properties"][number]>
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      horizontal={true}
      initialNumToRender={6}
      ItemSeparatorComponent={() => <Box height={"100%"} width={6} />}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}
