// @flow

import React, { useState, useMemo, useCallback, useRef } from "react";

import { useSelector } from "react-redux";
import { useRoute, useTheme } from "@react-navigation/native";
import Animated, { Value, event } from "react-native-reanimated";
import { nftsByCollections } from "@ledgerhq/live-common/lib/nft";
import type { CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";
import { View, FlatList, SafeAreaView, StyleSheet } from "react-native";

import LoadingFooter from "../../../components/LoadingFooter";
import { accountSelector } from "../../../reducers/accounts";
import NftCollectionWithName from "./NftCollectionWithName";

const MAX_COLLECTIONS_FIRST_RENDER = 12;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

const CollectionsList = Animated.createAnimatedComponent(FlatList);

const renderItem = ({ item: collection }) => (
  <View style={styles.collectionContainer}>
    <NftCollectionWithName
      key={collection.contract}
      collectionWithNfts={collection}
    />
  </View>
);

const NftGallery = () => {
  const { colors } = useTheme();
  const { params } = useRoute();
  const account = useSelector(state =>
    accountSelector(state, { accountId: params.accountId }),
  );

  const scrollY = useRef(new Value(0)).current;
  const onScroll = event(
    [
      {
        nativeEvent: {
          contentOffset: { y: scrollY },
        },
      },
    ],
    { useNativeDriver: true },
  );

  const [collectionsCount, setCollectionsCount] = useState(
    MAX_COLLECTIONS_FIRST_RENDER,
  );
  const collections = useMemo(() => nftsByCollections(account.nfts), [
    account.nfts,
  ]);
  const collectionsSlice = useMemo(
    () => collections.slice(0, collectionsCount),
    [collections, collectionsCount],
  );

  const onEndReached = useCallback(() => {
    setCollectionsCount(
      collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED,
    );
  }, [collectionsCount]);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <CollectionsList
        data={collectionsSlice}
        keyExtractor={(collection: CollectionWithNFT) => collection.contract}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onScroll={onScroll}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        ListFooterComponent={() =>
          collections.length > collectionsCount ? <LoadingFooter /> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  collectionContainer: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 8,
  },
});

export default NftGallery;
