// @flow

import React, { useCallback } from "react";
import type { NFT, CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";
import { FlatList, View, SafeAreaView, StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import NftCard from "../../../components/Nft/NftCard";
import Skeleton from "../../../components/Skeleton";
import LText from "../../../components/LText";

type Props = {
  collectionWithNfts: CollectionWithNFT,
  contentContainerStyle?: Object,
};

const NftCollectionWithName = ({
  collectionWithNfts,
  contentContainerStyle,
}: Props) => {
  const { contract, nfts } = collectionWithNfts;
  const { status, metadata } = useNftMetadata(contract, nfts?.[0]?.tokenId);

  const renderItem = useCallback(
    ({ item, index }) => (
      <NftCard
        key={item.id}
        nft={item}
        collection={collectionWithNfts}
        style={[
          styles.nftCard,
          {
            paddingLeft: index % 2 !== 0 ? 8 : 0,
            paddingRight: index % 2 === 0 ? 8 : 0,
          },
        ]}
      />
    ),
    [collectionWithNfts],
  );

  return (
    <SafeAreaView style={contentContainerStyle}>
      <View style={styles.title}>
        <Skeleton
          style={styles.tokenNameSkeleton}
          loading={status === "loading"}
        >
          <LText
            numberOfOfLines={2}
            ellipsizeMode="tail"
            semiBold
            style={styles.tokenName}
          >
            {metadata?.tokenName || contract}
          </LText>
        </Skeleton>
      </View>
      <FlatList
        data={nfts}
        keyExtractor={(nft: NFT) => nft.id}
        scrollEnabled={false}
        numColumns={2}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    paddingBottom: 16,
  },
  tokenNameSkeleton: {
    height: 12,
    width: 250,
    borderRadius: 4,
  },
  tokenName: {
    fontSize: 22,
  },
  nftCard: {
    flex: 1,
    maxWidth: "50%",
  },
});

export default NftCollectionWithName;
