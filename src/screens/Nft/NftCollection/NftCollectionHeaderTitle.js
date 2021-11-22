/* @flow */
import React from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import { useRoute, useTheme } from "@react-navigation/native";
import { scrollToTop } from "../../../navigation/utils";
import NftImage from "../../../components/Nft/NftImage";
import LText from "../../../components/LText";

const NftCollectionHeaderTitle = () => {
  const { params } = useRoute();
  const { colors } = useTheme();
  const { status, metadata } = useNftMetadata(
    params.collection.contract,
    params.collection.nfts[0].tokenId,
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
          height={24}
          width={24}
          style={styles.headerImage}
          src={metadata?.media}
          status={status}
        />
        <LText
          ellipsizeMode={metadata?.tokenName ? "tail" : "middle"}
          semiBold
          secondary
          numberOfLines={1}
          style={styles.title}
        >
          {metadata?.tokenName || params.collection.contract}
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
    marginRight: 12,
  },
});

export default NftCollectionHeaderTitle;
