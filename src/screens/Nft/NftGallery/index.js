// @flow

import React, { useState, useMemo, useCallback, useRef } from "react";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Animated, { Value, event } from "react-native-reanimated";
import { nftsByCollections } from "@ledgerhq/live-common/lib/nft";
import type { CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
} from "react-native";

import LoadingFooter from "../../../components/LoadingFooter";
import { accountSelector } from "../../../reducers/accounts";
import NftCollectionWithName from "./NftCollectionWithName";
import { NavigatorName, ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SendIcon from "../../../icons/Send";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";

const MAX_COLLECTIONS_FIRST_RENDER = 12;
const COLLECTIONS_TO_ADD_ON_LIST_END_REACHED = 6;

const CollectionsList = Animated.createAnimatedComponent(FlatList);

const renderItem = ({ item: collection }) => (
  <View style={styles.collectionContainer}>
    <NftCollectionWithName
      key={collection.contract}
      collectionWithNfts={collection}
    />
  </View>
);

const NftGallery = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { params } = useRoute();
  const account = useSelector(state =>
    accountSelector(state, { accountId: params.accountId }),
  );

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
  const collections = useMemo(() => nftsByCollections(account.nfts), [
    account.nfts,
  ]);
  const collectionsSlice = useMemo(
    () => collections.slice(0, collectionsCount),
    [collections, collectionsCount],
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
        collections,
      },
    });

  return (
    <SafeAreaView
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
        keyExtractor={(collection: CollectionWithNFT) => collection.contract}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  collectionsList: {
    paddingTop: 24,
    paddingBottom: 32,
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
export default withDiscreetMode(NftGallery);
