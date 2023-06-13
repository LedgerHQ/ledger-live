import React, { useState, useMemo, useCallback, memo } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import type { ListRenderItem } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { nftsByCollections } from "@ledgerhq/live-common/nft/index";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import LoadingFooter from "../../../components/LoadingFooter";
import { accountSelector } from "../../../reducers/accounts";
import NftCollectionWithName from "./NftCollectionWithName";
import { NavigatorName, ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SendIcon from "../../../icons/Send";
import { hiddenNftCollectionsSelector } from "../../../reducers/settings";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import type { State } from "../../../reducers/types";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "../../../components/RootNavigator/types/AccountsNavigator";
import InfoModal from "../../../modals/Info";
import { notAvailableModalInfo } from "../NftInfoNotAvailable";

const MAX_COLLECTIONS_FIRST_RENDER = 12;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftGallery>
>;

const NftGallery = () => {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { params } = useRoute<NavigationProps["route"]>();
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId: params?.accountId }),
  );
  const [isOpen, setOpen] = useState<boolean>(false);

  const onOpenModal = useCallback(() => {
    setOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const [collectionsCount, setCollectionsCount] = useState(MAX_COLLECTIONS_FIRST_RENDER);

  const collections = useMemo(
    () =>
      Object.entries(nftsByCollections((account as Account).nfts)).filter(
        ([contract]) => !hiddenNftCollections.includes(`${(account as Account).id}|${contract}`),
      ),
    [account, hiddenNftCollections],
  ) as [string, ProtoNFT[]][];

  const collectionsSlice: Array<ProtoNFT[]> = useMemo(
    () => collections.slice(0, collectionsCount).map(([, collection]) => collection),
    [collections, collectionsCount],
  );

  const renderItem: ListRenderItem<ProtoNFT[]> = ({ item: collection }) =>
    account ? (
      <View>
        <NftCollectionWithName
          key={collection?.[0]?.contract}
          collection={collection}
          account={account}
        />
      </View>
    ) : null;

  const onEndReached = useCallback(() => {
    setCollectionsCount(collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED);
  }, [collectionsCount]);

  const goToCollectionSelection = () =>
    account &&
    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendCollection,
      params: {
        account,
      },
    });

  const isNFTDisabled = useFeature("disableNftSend")?.enabled && Platform.OS === "ios";

  return (
    <>
      <InfoModal
        isOpened={isOpen}
        onClose={onCloseModal}
        data={notAvailableModalInfo(onCloseModal)}
      />
      <TabBarSafeAreaView
        edges={["left", "right", "bottom"]}
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
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
      </TabBarSafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  collectionsList: {
    paddingTop: 24,
    paddingBottom: TAB_BAR_SAFE_HEIGHT,
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
