import React from "react";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import MinimalAppCard from "./MinimalAppCard";
import LoadingIndicator from "../LoadingIndicator";

type Props = {
  title: string;
  isLoading: boolean;
  data: AppManifest[];
  onEndReached?: () => void;
  extraData: { onPress: (manifest: string) => void };
};

type PropRenderItem = {
  item: AppManifest;
  extraData?: { onPress: (manifest: string) => void };
};

const identityFn = (item: AppManifest) => item.id.toString();

const renderItem = ({ item, extraData }: PropRenderItem) => {
  return <MinimalAppCard key={item.id} item={item} onPress={() => extraData?.onPress(item.id)} />;
};

export default function HorizontalList({ title, isLoading, data, onEndReached, extraData }: Props) {
  return (
    <>
      <Text mt={2} mb={5} numberOfLines={1} variant="h5" mx={5} accessibilityRole="header">
        {title}
      </Text>
      <View style={{ height: "auto", marginBottom: 2 }}>
        <FlashList
          testID={`web3hub-horizontal-list-${title}`}
          horizontal
          contentContainerStyle={styles.container}
          keyExtractor={identityFn}
          renderItem={renderItem}
          ListFooterComponent={
            isLoading ? (
              <Flex marginX={3} justifyContent={"center"} height={"50"}>
                <LoadingIndicator />
              </Flex>
            ) : null
          }
          estimatedItemSize={75}
          data={data}
          showsHorizontalScrollIndicator={false}
          extraData={extraData}
          onEndReached={onEndReached}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
  },
});
