import React, { useState, useMemo, useCallback, memo } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import type { ListRenderItem } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { nftsByCollections } from "@ledgerhq/live-nft";
import { useNavigation, useRoute } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import LoadingFooter from "~/components/LoadingFooter";
import { accountSelector } from "~/reducers/accounts";
import NftCollectionWithName from "./NftCollectionWithName";
import { NavigatorName, ScreenName } from "~/const";
import Button from "~/components/Button";
import SendIcon from "~/icons/Send";
import type { State } from "~/reducers/types";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import InfoModal from "~/modals/Info";
import { notAvailableModalInfo } from "../NftInfoNotAvailable";
import invariant from "invariant";
import { useNftGalleryFilter, getThreshold } from "@ledgerhq/live-nft-react";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import SafeAreaView from "~/components/SafeAreaView";

const MAX_COLLECTIONS_FIRST_RENDER = 12;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftGallery>
>;

const NftGallery = () => {
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const threshold = nftsFromSimplehashFeature?.params?.threshold;
  const nftsFromSimplehashEnabled = nftsFromSimplehashFeature?.enabled;
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();
  const { params } = useRoute<NavigationProps["route"]>();
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId: params?.accountId }),
  );
  invariant(account, "account required");

  const [isOpen, setOpen] = useState<boolean>(false);
  const onOpenModal = useCallback(() => {
    setOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  const { nfts, fetchNextPage, hasNextPage } = useNftGalleryFilter({
    nftsOwned: account.nfts || [],
    addresses: account.freshAddress,
    chains: [account.currency.id],
    threshold: getThreshold(threshold),
    enabled: nftsFromSimplehashEnabled || false,
    staleTime: nftsFromSimplehashFeature?.params?.staleTime,
  });

  const { hiddenNftCollections } = useNftCollectionsStatus();
  const collections = useMemo(
    () =>
      Object.entries(nftsByCollections(nftsFromSimplehashEnabled ? nfts : account.nfts)).filter(
        ([contract]) => !hiddenNftCollections.includes(`${account.id}|${contract}`),
      ),
    [account.id, account.nfts, hiddenNftCollections, nfts, nftsFromSimplehashEnabled],
  ) as [string, ProtoNFT[]][];

  const [collectionsCount, setCollectionsCount] = useState(MAX_COLLECTIONS_FIRST_RENDER);
  const collectionsSlice: Array<ProtoNFT[]> = useMemo(
    () => collections.slice(0, collectionsCount).map(([, collection]) => collection),
    [collections, collectionsCount],
  );

  const renderItem: ListRenderItem<ProtoNFT[]> = useCallback(
    ({ item: collection }) => (
      <View>
        <NftCollectionWithName
          key={collection?.[0]?.contract}
          collection={collection}
          account={account}
        />
      </View>
    ),
    [account],
  );

  const onEndReached = useCallback(() => {
    setCollectionsCount(collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED);
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [collectionsCount, fetchNextPage, hasNextPage]);

  const goToCollectionSelection = useCallback(
    () =>
      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendCollection,
        params: {
          account,
        },
      }),
    [account, navigation],
  );

  const isNFTDisabled = useFeature("disableNftSend")?.enabled && Platform.OS === "ios";

  return (
    <SafeAreaView isFlex edges={["bottom"]}>
      <InfoModal
        isOpened={isOpen}
        onClose={onCloseModal}
        data={notAvailableModalInfo(onCloseModal)}
      />
      <FlatList
        data={collectionsSlice}
        contentContainerStyle={styles.collectionsList}
        renderItem={renderItem}
        onEndReached={onEndReached}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sendButtonContainer}>
            <Button
              type="primary"
              IconLeft={SendIcon}
              containerStyle={styles.sendButton}
              title={t("account.send")}
              onPress={isNFTDisabled ? onOpenModal : goToCollectionSelection}
            />
          </View>
        }
        ListFooterComponent={() =>
          collections.length > collectionsCount ? <LoadingFooter /> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  collectionsList: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  sendButtonContainer: {
    marginBottom: 16,
    zIndex: 2,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {
          height: 6,
          width: 0,
        },
      },
    }),
  },
  sendButton: {
    borderRadius: 100,
  },
});
export default memo(withDiscreetMode(NftGallery));
