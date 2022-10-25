import React, { useState, useMemo, useCallback, useRef, memo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  ListRenderItem,
} from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ProtoNFT } from "@ledgerhq/types-live";
import Animated, { Value, event } from "react-native-reanimated";
import { nftsByCollections } from "@ledgerhq/live-common/nft/index";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
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

const MAX_COLLECTIONS_FIRST_RENDER = 12;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

const CollectionsList = Animated.createAnimatedComponent(FlatList);

const NftGallery = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { params } = useRoute();
  const account = useSelector(state =>
    accountSelector(state, { accountId: params.accountId }),
  );

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const scrollY = useRef(new Value(0)).current;
  const onScroll = event(
    [
      {
        nativeEvent: {
          contentOffset: { y: scrollY },
        },
      },
    ],
    { useNativeDriver: true },
  );

  const [collectionsCount, setCollectionsCount] = useState(
    MAX_COLLECTIONS_FIRST_RENDER,
  );
  const collections = useMemo(
    () =>
      Object.entries(nftsByCollections(account.nfts)).filter(
        ([contract]) =>
          !hiddenNftCollections.includes(`${account.id}|${contract}`),
      ),
    [account.id, account.nfts, hiddenNftCollections],
  ) as [string, ProtoNFT[]][];

  const collectionsSlice: Array<ProtoNFT[]> = useMemo(
    () =>
      collections
        .slice(0, collectionsCount)
        .map(([, collection]) => collection),
    [collections, collectionsCount],
  );

  const renderItem: ListRenderItem<ProtoNFT[]> = ({ item: collection }) => (
    <View style={styles.collectionContainer}>
      <NftCollectionWithName
        key={collection?.[0]?.contract}
        collection={collection}
        account={account}
      />
    </View>
  );

  const onEndReached = useCallback(() => {
    setCollectionsCount(
      collectionsCount + COLLECTIONS_TO_ADD_ON_LIST_END_REACHED,
    );
  }, [collectionsCount]);

  const goToCollectionSelection = () =>
    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendCollection,
      params: {
        account,
      },
    });

  return (
    <TabBarSafeAreaView
      edges={["left", "right", "bottom"]}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <CollectionsList
        data={collectionsSlice}
        contentContainerStyle={styles.collectionsList}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onScroll={onScroll}
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
              onPress={goToCollectionSelection}
            />
          </View>
        }
        ListFooterComponent={() =>
          collections.length > collectionsCount ? <LoadingFooter /> : null
        }
      />
    </TabBarSafeAreaView>
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
