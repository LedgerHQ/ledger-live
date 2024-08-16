import React, { useCallback } from "react";
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
  extraData: (manifest: AppManifest) => void;
  testID?: string;
};

type PropRenderItem = {
  item: AppManifest;
  extraData?: (manifest: AppManifest) => void;
};

const identityFn = (item: AppManifest) => item.id;

export default function HorizontalList({
  title,
  isLoading,
  data,
  onEndReached,
  extraData,
  testID,
}: Props) {
  const renderItem = useCallback(({ item, extraData = () => {} }: PropRenderItem) => {
    const disabled = item.branch === "soon";
    const handlePress = () => {
      if (!disabled) {
        extraData(item);
      }
    };

    return <MinimalAppCard key={item.id} disabled={disabled} item={item} onPress={handlePress} />;
  }, []);

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
          extraData={extraData}
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
