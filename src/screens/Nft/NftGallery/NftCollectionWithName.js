// @flow

import React, { useCallback, memo } from "react";
import type { NFT, CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";
import { FlatList, View, SafeAreaView, StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import NftCard from "../../../components/Nft/NftCard";
import Skeleton from "../../../components/Skeleton";
import LText from "../../../components/LText";

const NftCollectionWithNameList = ({
  collectionWithNfts,
  contentContainerStyle,
  status,
  metadata,
}: {
  collectionWithNfts: CollectionWithNFT,
  contentContainerStyle?: Object,
  status: "queued" | "loading" | "loaded" | "error" | "nodata",
  metadata?: Object,
}) => {
  const { contract, nfts } = collectionWithNfts;

  const renderItem = useCallback(
    ({ item, index }) => (
      <NftCard
        key={item.id}
        nft={item}
        collection={collectionWithNfts}
        style={index % 2 === 0 ? evenNftCardStyles : oddNftCardStyles}
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
        keyExtractor={nftKeyExtractor}
        scrollEnabled={false}
        numColumns={2}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

const NftCollectionWithNameMemo = memo(NftCollectionWithNameList);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all Nft Collections whenever the NFT cache changes (whenever a new NFT is loaded)
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

  return (
    <NftCollectionWithNameMemo
      collectionWithNfts={collectionWithNfts}
      contentContainerStyle={contentContainerStyle}
      status={status}
      metadata={metadata}
    />
  );
};

const nftKeyExtractor = (nft: NFT) => nft.id;

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

const evenNftCardStyles = [
  styles.nftCard,
  {
    paddingLeft: 0,
    paddingRight: 8,
  },
];

const oddNftCardStyles = [
  styles.nftCard,
  {
    paddingLeft: 8,
    paddingRight: 0,
  },
];

export default memo<Props>(NftCollectionWithName);
