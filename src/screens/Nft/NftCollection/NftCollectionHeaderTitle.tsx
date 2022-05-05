import React, { memo } from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import {
  useNftMetadata,
  useNftCollectionMetadata,
} from "@ledgerhq/live-common/lib/nft";
import { useRoute, useTheme, RouteProp } from "@react-navigation/native";
import { ProtoNFT } from "@ledgerhq/live-common/lib/types";
import { scrollToTop } from "../../../navigation/utils";
import NftImage from "../../../components/Nft/NftImage";
import LText from "../../../components/LText";

type RouteParams = RouteProp<{ params: { collection: ProtoNFT[] } }, "params">;

const NftCollectionHeaderTitle = () => {
  const { params } = useRoute<RouteParams>();
  const { colors } = useTheme();
  const { collection } = params;
  const nft = collection?.[0];
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );
  const { metadata: collectionMetadata } = useNftCollectionMetadata(
    nft?.contract,
    nft?.currencyId,
  );

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <NftImage
          style={styles.headerImage}
          src={nftMetadata?.media}
          status={nftStatus}
        />
        <LText
          ellipsizeMode={collectionMetadata?.tokenName ? "tail" : "middle"}
          semiBold
          secondary
          numberOfLines={1}
          style={styles.title}
        >
          {collectionMetadata?.tokenName || nft?.contract}
        </LText>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    paddingRight: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 32,
    paddingVertical: 5,
  },
  headerImage: {
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
    width: 24,
    height: 24,
  },
});

export default memo(NftCollectionHeaderTitle);
