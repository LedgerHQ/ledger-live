// @flow

import React, { useCallback, useMemo } from "react";

import take from "lodash/take";
import { Trans, useTranslation } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { nftsByCollections } from "@ledgerhq/live-common/lib/nft";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Platform, StyleSheet, View, FlatList } from "react-native";

import type { Account } from "@ledgerhq/live-common/lib/types";

import NftCollectionRow from "../../components/Nft/NftCollectionRow";
import { NavigatorName, ScreenName } from "../../const";
import ArrowRight from "../../icons/ArrowRight";
import ReceiveIcon from "../../icons/Receive";
import Button from "../../components/Button";
import LText from "../../components/LText";

const MAX_COLLECTIONS_TO_SHOW = 3;

const collectionKeyExtractor = o => o.contract;

const Card = ({ children, style }: { children: any, style: * }) => (
  <View style={style}>{children}</View>
);

type Props = {
  account: Account,
};

export default function NftCollectionsList({ account }: Props) {
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { nfts } = account;
  const nftCollections = useMemo(() => nftsByCollections(nfts), [nfts]);

  const navigateToReceive = useCallback(
    () =>
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConnectDevice,
        params: {
          accountId: account.id,
        },
      }),
    [account.id, navigation],
  );

  // Forced to use useCallback here to avoid a non sensical warning...
  const navigateToCollection = useCallback(
    collection =>
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.NftCollection,
        params: {
          collection,
          accountId: account.id,
        },
        initial: false,
      }),
    [account.id, navigation],
  );

  const navigateToGallery = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.NftGallery,
      params: {
        title: t("nft.gallery.allNft"),
        accountId: account.id,
      },
      initial: false,
    });
  }, [account.id, navigation, t]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <LText semiBold style={{ fontSize: 16 }}>
          NFT
        </LText>
        <Button
          type="lightSecondary"
          event="AccountReceiveToken"
          title={<Trans i18nKey="account.nft.receiveNft" />}
          IconLeft={() => <ReceiveIcon color={colors.live} size={20} />}
          onPress={navigateToReceive}
          size={14}
        />
      </View>
    ),
    [],
  );

  const renderFooter = useCallback(
    () =>
      nftCollections.length > MAX_COLLECTIONS_TO_SHOW && (
        <Card
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              ...Platform.select({
                android: {},
                ios: {
                  shadowColor: colors.black,
                },
              }),
            },
          ]}
        >
          <RectButton onPress={navigateToGallery} style={styles.footer}>
            <LText
              semiBold
              style={[
                styles.footerText,
                {
                  color: colors.live,
                },
              ]}
            >
              <Trans i18nKey="nft.account.seeAllNfts" />
            </LText>
            <ArrowRight size={16} color={colors.live} />
          </RectButton>
        </Card>
      ),
    [colors, navigateToGallery, nftCollections.length],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <NftCollectionRow
          collection={item}
          onCollectionPress={() => navigateToCollection(item)}
        />
      </Card>
    ),
    [colors, navigateToCollection],
  );

  return (
    <View style={styles.collectionList}>
      <FlatList
        data={take(nftCollections, MAX_COLLECTIONS_TO_SHOW)}
        renderItem={renderItem}
        keyExtractor={collectionKeyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collectionList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 8,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
});
