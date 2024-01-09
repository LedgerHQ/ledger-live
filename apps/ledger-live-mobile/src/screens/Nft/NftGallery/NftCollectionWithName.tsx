import React, { useCallback, useState, memo } from "react";
import type { ViewProps } from "react-native";
import { useNftCollectionMetadata } from "@ledgerhq/live-common/nft/index";
import { FlatList, View, SafeAreaView, StyleSheet } from "react-native";
import { Account, ProtoNFT, NFTMetadata, NFTMetadataResponse } from "@ledgerhq/types-live";
import { OthersMedium } from "@ledgerhq/native-ui/assets/icons";
import {
  NFTResource,
  NFTResourceLoaded,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import NftCard from "~/components/Nft/NftCard";
import Touchable from "~/components/Touchable";
import Skeleton from "~/components/Skeleton";
import LText from "~/components/LText";
import NftCollectionOptionsMenu from "~/components/Nft/NftCollectionOptionsMenu";

const renderItem = ({ item, index }: { item: ProtoNFT; index: number }) => (
  <NftCard
    key={item.id}
    nft={item}
    style={index % 2 === 0 ? evenNftCardStyles : oddNftCardStyles}
  />
);

const NftCollectionWithNameList = ({
  collection,
  account,
  contentContainerStyle,
  status,
  metadata,
}: {
  account: Account;
  collection: ProtoNFT[];
  contentContainerStyle?: ViewProps["style"];
  status: NFTResource["status"];
  metadata?: NFTMetadata | null;
}) => {
  const nft = collection?.[0] || {};
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);

  const onOpenCollectionMenu = useCallback(() => setIsCollectionMenuOpen(true), []);
  const onCloseCollectionMenu = useCallback(() => setIsCollectionMenuOpen(false), []);

  return (
    <SafeAreaView style={contentContainerStyle}>
      <View style={styles.title}>
        <Skeleton style={styles.tokenNameSkeleton} loading={status === "loading"}>
          <LText numberOfLines={2} ellipsizeMode="tail" semiBold style={styles.tokenName}>
            {metadata?.tokenName || nft?.contract}
          </LText>
        </Skeleton>
        <Touchable event="ShowNftCollectionMenu" onPress={onOpenCollectionMenu}>
          <OthersMedium size={24} color="neutral.c100" />
        </Touchable>
      </View>
      <FlatList
        data={collection}
        keyExtractor={nftKeyExtractor}
        scrollEnabled={false}
        numColumns={2}
        renderItem={renderItem}
      />

      <NftCollectionOptionsMenu
        isOpen={isCollectionMenuOpen}
        collection={collection}
        onClose={onCloseCollectionMenu}
        account={account}
      />
    </SafeAreaView>
  );
};

const NftCollectionWithNameMemo = memo(NftCollectionWithNameList);
// this technique of splitting the usage of context and memoing the presentational component is used to prevent
// the rerender of all Nft Collections whenever the NFT cache changes (whenever a new NFT is loaded)
type Props = {
  collection: ProtoNFT[];
  contentContainerStyle?: ViewProps["style"];
  account: Account;
};

const NftCollectionWithName = ({ collection, contentContainerStyle, account }: Props) => {
  const nft: ProtoNFT | null = collection[0];
  const { status, metadata } = useNftCollectionMetadata(
    nft?.contract,
    nft?.currencyId,
  ) as NFTResourceLoaded;

  return (
    <NftCollectionWithNameMemo
      collection={collection}
      contentContainerStyle={contentContainerStyle}
      account={account}
      status={status}
      metadata={metadata as NFTMetadataResponse["result"]}
    />
  );
};

const nftKeyExtractor = (nft: ProtoNFT) => nft?.id;

const styles = StyleSheet.create({
  title: {
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
