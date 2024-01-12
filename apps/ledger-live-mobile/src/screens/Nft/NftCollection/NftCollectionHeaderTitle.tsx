import React, { memo } from "react";
import { TouchableWithoutFeedback, StyleSheet } from "react-native";
import { useNftMetadata, useNftCollectionMetadata } from "@ledgerhq/live-common/nft/index";
import { useRoute, RouteProp } from "@react-navigation/native";
import type {
  NFTResourceLoaded,
  NFTResourceLoading,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { ProtoNFT } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import { scrollToTop } from "~/navigation/utils";
import NftMedia from "~/components/Nft/NftMedia";

type RouteParams = RouteProp<{ params: { collection: ProtoNFT[] } }, "params">;

const NftCollectionHeaderTitle = () => {
  const { params } = useRoute<RouteParams>();
  const { collection } = params;
  const nft = collection?.[0];
  const nftMedata = useNftMetadata(nft?.contract, nft?.tokenId, nft?.currencyId);
  const { status: nftStatus, metadata: nftMetadata } = nftMedata as NFTResourceLoading &
    NFTResourceLoaded;
  const { metadata: collectionMetadata } = useNftCollectionMetadata(
    nft?.contract,
    nft?.currencyId,
  ) as NFTResourceLoaded;

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Flex alignItems={"center"} flexDirection={"row"} ml={7} mr={9}>
        <NftMedia
          style={styles.headerImage}
          metadata={nftMetadata}
          mediaFormat={"preview"}
          status={nftStatus}
        />
        <Text
          variant={"body"}
          fontWeight={"semiBold"}
          numberOfLines={1}
          ellipsizeMode={collectionMetadata?.tokenName ? "tail" : "middle"}
        >
          {collectionMetadata?.tokenName || nft?.contract}
        </Text>
      </Flex>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
    width: 24,
    height: 24,
  },
});

export default memo(NftCollectionHeaderTitle);
