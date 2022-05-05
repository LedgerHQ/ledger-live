// @flow
import React, { useCallback, useMemo, useState, memo } from "react";

import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  nftsByCollections,
  useNftCollectionMetadata,
  useNftMetadata,
} from "@ledgerhq/live-common/lib/nft";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Account, ProtoNFT } from "@ledgerhq/live-common/lib/types";
import LoadingFooter from "../../components/LoadingFooter";
import NftImage from "../../components/Nft/NftImage";
import Skeleton from "../../components/Skeleton";
import ChevronIcon from "../../icons/Chevron";
import LText from "../../components/LText";
import { ScreenName } from "../../const";

const MAX_COLLECTIONS_FIRST_RENDER = 8;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 8;

const CollectionRow = memo(
  ({ account, collection }: { account: Account; collection: ProtoNFT[] }) => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const nft: ProtoNFT | null = collection[0];
    const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
      nft?.contract,
      nft?.tokenId,
      nft?.currencyId,
    );
    const { metadata: collectionMetadata } = useNftCollectionMetadata(
      nft?.contract,
      nft?.currencyId,
    );

    const goToNftSelection = () => {
      navigation.navigate(ScreenName.SendNft, {
        account,
        collection,
      });
    };

    return (
      <TouchableOpacity style={styles.collectionRow} onPress={goToNftSelection}>
        <View style={styles.nftImageContainer}>
          <NftImage
            style={styles.nftImage}
            src={nftMetadata?.media}
            status={nftStatus}
          />
        </View>
        <View style={styles.tokenNameContainer}>
          <Skeleton
            style={[styles.tokenNameSkeleton, styles.tokenName]}
            loading={nftStatus === "loading"}
          >
            <LText>{collectionMetadata?.tokenName || nft?.contract}</LText>
          </Skeleton>
        </View>
        <View style={styles.chevronContainer}>
          <ChevronIcon size={11} color={colors.grey} />
        </View>
      </TouchableOpacity>
    );
  },
);

const keyExtractor = (collection: ProtoNFT[]) => collection?.[0]?.contract;

type Props = {
  route: {
    params: {
      account: Account;
    };
  };
};

const SendFundsSelectCollection = ({ route }: Props) => {
  const { params } = route;
  const { account } = params;
  const { colors } = useTheme();

  const [collectionCount, setCollectionCount] = useState(
    MAX_COLLECTIONS_FIRST_RENDER,
  );
  const collections = useMemo(() => nftsByCollections(account.nfts), [
    account.nfts,
  ]);
  const collectionsSlice = useMemo(
    () => Object.values(collections).slice(0, collectionCount),
    [collections, collectionCount],
  );
  const onEndReached = useCallback(
    () =>
      setCollectionCount(
        collectionCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED,
      ),
    [collectionCount, setCollectionCount],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProtoNFT[] }) => (
      <CollectionRow account={account} collection={item} />
    ),
    [account],
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      <FlatList
        contentContainerStyle={styles.collections}
        data={collectionsSlice}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        ListFooterComponent={
          collectionCount < collections.length ? <LoadingFooter /> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  collections: {
    paddingBottom: 32,
  },
  collectionRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  nftImageContainer: {
    flexGrow: 0,
    width: 48,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: {
          height: 2,
        },
      },
    }),
  },
  nftImage: {
    height: 48,
    width: 48,
    borderRadius: 4,
    overflow: "hidden",
  },
  tokenNameContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tokenNameSkeleton: {
    height: 12,
    borderRadius: 4,
  },
  tokenName: {},
  chevronContainer: {
    flexGrow: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    transform: [
      {
        rotate: "-90deg",
      },
    ],
  },
});

export default memo(SendFundsSelectCollection);
