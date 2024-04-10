import React, { useCallback, useMemo, useState, memo } from "react";

import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { nftsByCollections } from "@ledgerhq/live-nft";
import {
  isThresholdValid,
  useNftCollectionMetadata,
  useNftGalleryFilter,
  useNftMetadata,
} from "@ledgerhq/live-nft-react";
import type { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hiddenNftCollectionsSelector } from "~/reducers/settings";
import LoadingFooter from "~/components/LoadingFooter";
import NftMedia from "~/components/Nft/NftMedia";
import Skeleton from "~/components/Skeleton";
import ChevronIcon from "~/icons/Chevron";
import LText from "~/components/LText";
import { ScreenName } from "~/const";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const MAX_COLLECTIONS_FIRST_RENDER = 8;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 8;

const CollectionRow = memo(
  ({ account, collection }: { account: Account; collection: ProtoNFT[] }) => {
    const navigation =
      useNavigation<
        StackNavigatorNavigation<SendFundsNavigatorStackParamList, ScreenName.SendCollection>
      >();
    const { colors } = useTheme();
    const nft: ProtoNFT | undefined = collection[0];
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
          {nftMetadata ? (
            <NftMedia
              style={styles.nftImage}
              metadata={nftMetadata}
              status={nftStatus}
              mediaFormat={"preview"}
            />
          ) : null}
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

type Props = StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendCollection>;

const SendFundsSelectCollection = ({ route }: Props) => {
  const { params } = route;
  const { account } = params;
  const { colors } = useTheme();
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = nftsFromSimplehashFeature?.params?.threshold;
  const nftsFromSimplehashEnabled = nftsFromSimplehashFeature?.enabled;
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const { nfts, fetchNextPage, hasNextPage } = useNftGalleryFilter({
    nftsOwned: account.nfts || [],
    addresses: account.freshAddress,
    chains: [account.currency.id],
    threshold: isThresholdValid(thresold) ? Number(thresold) : 75,
  });

  const [collectionsCount, setCollectionsCount] = useState(MAX_COLLECTIONS_FIRST_RENDER);
  const collections = useMemo(
    () =>
      Object.entries(nftsByCollections(nftsFromSimplehashEnabled ? nfts : account.nfts)).filter(
        ([contract]) => !hiddenNftCollections.includes(`${account.id}|${contract}`),
      ),
    [account.id, account.nfts, hiddenNftCollections, nfts, nftsFromSimplehashEnabled],
  ) as [string, ProtoNFT[]][];

  const collectionsSlice: Array<ProtoNFT[]> = useMemo(
    () => collections.slice(0, collectionsCount).map(([, collection]) => collection),
    [collections, collectionsCount],
  );
  const onEndReached = useCallback(() => {
    setCollectionsCount(collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED);

    if (hasNextPage) {
      fetchNextPage();
    }
  }, [collectionsCount, fetchNextPage, hasNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ProtoNFT[] }) => <CollectionRow account={account} collection={item} />,
    [account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={styles.collections}
        data={collectionsSlice}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        ListFooterComponent={collectionsCount < collections.length ? <LoadingFooter /> : null}
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
          // FIXME: width WAS MISSING, ADDING 0 BUT THE VALUE MAY NEED TO BE REWORKED
          width: 0,
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

export default memo<Props>(SendFundsSelectCollection);
