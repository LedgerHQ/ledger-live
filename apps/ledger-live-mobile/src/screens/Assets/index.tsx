import React, { memo, useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";
import { RefreshMedium } from "@ledgerhq/native-ui/assets/icons";

import { useTranslation } from "react-i18next";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { FlatList } from "react-native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  useDistribution,
  useRefreshAccountsOrdering,
} from "../../actions/general";
import { isUpToDateSelector } from "../../reducers/accounts";
import TrackScreen from "../../analytics/TrackScreen";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import AssetRow from "../WalletCentricAsset/AssetRow";

import Spinning from "../../components/Spinning";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import AssetsNavigationHeader from "./AssetsNavigationHeader";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";

const List = globalSyncRefreshControl(FlatList);

function Assets() {
  const navigation = useNavigation();
  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");

  const { t } = useTranslation();
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const syncPending = globalSyncState.pending && !isUpToDate;

  const assets = useMemo(
    () =>
      distribution.isAvailable && distribution.list.length > 0
        ? distribution.list
        : [],
    [distribution],
  );

  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(
    () => setAddModalOpened(true),
    [setAddModalOpened],
  );

  const closeAddModal = useCallback(
    () => setAddModalOpened(false),
    [setAddModalOpened],
  );

  const renderItem = useCallback(
    ({ item }: { item: any; index: number }) => (
      <AssetRow asset={item} navigation={navigation} />
    ),
    [navigation],
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Assets List" />
      <Flex flex={1} bg={"background.main"}>
        <AssetsNavigationHeader />
        {syncPending && (
          <Flex flexDirection={"row"} alignItems={"center"} px={6} my={3}>
            <Spinning clockwise>
              <RefreshMedium size={20} color={"neutral.c80"} />
            </Spinning>
            <Text color={"neutral.c80"} ml={2}>
              {t("portfolio.syncPending")}
            </Text>
          </Flex>
        )}
        <Flex px={6} flex={1}>
          <List
            data={assets}
            renderItem={renderItem}
            keyExtractor={(i: any) => i.id}
            contentContainerStyle={{
              paddingBottom: TAB_BAR_SAFE_HEIGHT,
            }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Flex mt={3} mb={3}>
                <Text variant="h4">{t("distribution.title")}</Text>
              </Flex>
            }
            ListFooterComponent={
              <Button
                type="shade"
                size="large"
                outline
                mt={6}
                iconPosition="left"
                Icon={Icons.PlusMedium}
                onPress={openAddModal}
              >
                {t("portfolio.emptyState.buttons.import")}
              </Button>
            }
          />
        </Flex>
      </Flex>
      <AddAccountsModal
        navigation={navigation}
        isOpened={isAddModalOpened}
        onClose={closeAddModal}
      />
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(Assets));
