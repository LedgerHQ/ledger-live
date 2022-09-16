import React, { memo } from "react";
import { StyleSheet } from "react-native";
import {
  useNftCollectionMetadata,
  useNftMetadata,
} from "@ledgerhq/live-common/nft/index";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import Skeleton from "../Skeleton";
import NftMedia from "./NftMedia";
import Touchable from "../Touchable";

type Props = {
  collection: ProtoNFT[];
  onCollectionPress: () => void;
  onLongPress: () => void;
};

function NftCollectionRow({
  collection,
  onCollectionPress,
  onLongPress,
}: Props) {
  const nft = collection[0];
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );
  const { status: collectionStatus, metadata: collectionMetadata } =
    useNftCollectionMetadata(nft?.contract, nft?.currencyId);

  const loading = nftStatus === "loading" || collectionStatus === "loading";

  return (
    <Touchable
      event="ShowNftCollectionMenu"
      onPress={onCollectionPress}
      onLongPress={onLongPress}
    >
      <Flex accessible flexDirection={"row"} alignItems={"center"} py={6}>
        <NftMedia
          style={styles.collectionImage}
          status={nftStatus}
          metadata={nftMetadata}
          mediaFormat={"preview"}
        />
        <Flex flexGrow={1} flexShrink={1} ml={6} flexDirection={"column"}>
          <Skeleton style={styles.collectionNameSkeleton} loading={loading}>
            <Text
              fontWeight={"semiBold"}
              variant={"large"}
              ellipsizeMode="tail"
              numberOfLines={2}
            >
              {collectionMetadata?.tokenName || nft?.contract}
            </Text>
          </Skeleton>
        </Flex>
        <Text
          fontWeight={"medium"}
          variant={"large"}
          color={"neutral.c70"}
          ml={5}
        >
          {collection?.length}
        </Text>
      </Flex>
    </Touchable>
  );
}

export default memo(NftCollectionRow);

const styles = StyleSheet.create({
  collectionNameSkeleton: {
    height: 8,
    width: 113,
    borderRadius: 4,
  },
  collectionImage: {
    borderRadius: 4,
    width: 36,
    aspectRatio: 1,
    overflow: "hidden",
  },
});
