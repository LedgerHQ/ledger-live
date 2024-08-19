import React from "react";
import { StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Box, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import MinimalAppCard from "./MinimalAppCard";

type Props = {
  title: string;
  isLoading: boolean;
  data: AppManifest[];
  onEndReached?: () => void;
  onPressItem: (manifest: AppManifest) => void;
  testID?: string;
};

type PropRenderItem = {
  item: AppManifest;
  onPressItem?: (manifest: AppManifest) => void;
};

const identityFn = (item: AppManifest) => item.id;

const renderItem = ({ item, onPressItem = () => {} }: PropRenderItem) => {
  return <MinimalAppCard item={item} onPress={onPressItem} />;
};

export default function HorizontalList({
  title,
  isLoading,
  data,
  onEndReached,
  onPressItem,
  testID,
}: Props) {
  return (
    <>
      <Text mt={2} mb={5} numberOfLines={1} variant="h5" mx={5} accessibilityRole="header">
        {title}
      </Text>
      <Box mb={2}>
        <FlashList
          testID={testID}
          horizontal
          contentContainerStyle={styles.container}
          keyExtractor={identityFn}
          renderItem={renderItem}
          ListFooterComponent={
            isLoading ? (
              <Flex marginRight={4} justifyContent={"center"} paddingTop={3}>
                <InfiniteLoader size={30} />
              </Flex>
            ) : null
          }
          estimatedItemSize={70}
          data={data}
          showsHorizontalScrollIndicator={false}
          extraData={onPressItem}
          onEndReached={onEndReached}
        />
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
  },
});
