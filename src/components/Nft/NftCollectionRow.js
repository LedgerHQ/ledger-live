// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import type { CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";
import { useTheme } from "@react-navigation/native";
import Skeleton from "../Skeleton";
import NftImage from "./NftImage";
import LText from "../LText";

type Props = {
  collection: CollectionWithNFT,
  onCollectionPress: () => void,
};

function NftCollectionRow({ collection, onCollectionPress }: Props) {
  const { colors } = useTheme();
  const { contract, nfts } = collection;
  const { status, metadata } = useNftMetadata(contract, nfts[0].tokenId);
  const loading = status === "loading";

  return (
    <RectButton
      style={styles.container}
      underlayColor={colors.grey}
      onPress={onCollectionPress}
    >
      <View accessible style={styles.innerContainer}>
        <NftImage
          style={styles.collectionImage}
          status={status}
          src={metadata?.media}
        />
        <View style={styles.inner}>
          <Skeleton style={styles.collectionNameSkeleton} loading={loading}>
            <LText
              semiBold
              ellipsizeMode="tail"
              numberOfLines={2}
              style={styles.collectionName}
            >
              {metadata?.tokenName || collection.contract}
            </LText>
          </Skeleton>
        </View>
        <LText semiBold>{collection.nfts.length}</LText>
      </View>
    </RectButton>
  );
}

export default NftCollectionRow;

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
  },
  innerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  inner: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 16,
    flexDirection: "column",
  },
  collectionNameSkeleton: {
    height: 8,
    width: 113,
    borderRadius: 4,
  },
  collectionName: {
    fontSize: 16,
    marginBottom: 4,
    maxWidth: 218,
  },
  collectionImage: {
    borderRadius: 4,
    width: 36,
    aspectRatio: 1,
    overflow: "hidden",
  },
});
