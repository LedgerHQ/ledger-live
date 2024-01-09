import React, { useState, useCallback, useMemo, memo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { listTokens, isCurrencySupported } from "@ledgerhq/live-common/currencies/index";
import {
  distribute,
  Action,
  State,
  predictOptimisticState,
  reducer,
} from "@ledgerhq/live-common/apps/index";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { useAppsSections } from "@ledgerhq/live-common/apps/react";

import { Text, Flex } from "@ledgerhq/native-ui";

import { Trans } from "react-i18next";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppType, SortOptions } from "@ledgerhq/live-common/apps/filtering";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { ManagerTab } from "~/const/manager";

import AppFilter from "./AppsList/AppFilter";

import DeviceCard from "./Device";
import Benchmarking from "./Benchmarking";
import AppRow from "./AppsList/AppRow";

import Searchbar from "./AppsList/Searchbar";

import InstalledAppModal from "./Modals/InstalledAppModal";

import NoResultsFound from "~/icons/NoResultsFound";
import AppIcon from "./AppsList/AppIcon";
import AppUpdateAll from "./AppsList/AppUpdateAll";
import Search from "~/components/Search";
import FirmwareUpdateBanner from "~/components/FirmwareUpdateBanner";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/shared";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "~/components/RootNavigator/types/ManagerNavigator";
import { ScreenName } from "~/const";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import ProviderWarning from "./ProviderWarning";
import { UpdateStep } from "../FirmwareUpdate";

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.ManagerMain>
>;

type Props = {
  state: State;
  dispatch: (_: Action) => void;
  setStorageWarning: (value: string | null) => void;
  deviceId: string;
  initialDeviceName?: string | null;
  navigation: NavigationProps["navigation"];
  pendingInstalls: boolean;
  deviceInfo: DeviceInfo;
  device: Device;
  searchQuery?: string;
  updateModalOpened?: boolean;
  tab: ManagerTab;
  optimisticState: State;
  result: ListAppsResult;
  onLanguageChange: () => void;
  onBackFromUpdate: (updateState: UpdateStep) => void;
};

const AppsScreen = ({
  state,
  dispatch,
  setStorageWarning,
  updateModalOpened,
  deviceId,
  initialDeviceName,
  device,
  navigation,
  pendingInstalls,
  deviceInfo,
  searchQuery,
  optimisticState,
  result,
  onLanguageChange,
  onBackFromUpdate,
}: Props) => {
  const distribution = useMemo(() => {
    const newState = state.installQueue.length
      ? predictOptimisticState(
          reducer(state, {
            type: "install",
            name: state.installQueue[0],
          }),
        )
      : state;
    return distribute(newState);
  }, [state]);

  const [appFilter, setFilter] = useState<AppType | null | undefined>("all");
  const [sort, setSort] = useState<SortOptions["type"] | null | undefined>("marketcap");
  const [order, setOrder] = useState<SortOptions["order"] | null | undefined>("desc");

  const sortOptions = useMemo(
    () => ({
      type: sort,
      order,
    }),
    [sort, order],
  );

  const [query, setQuery] = useState(searchQuery || "");

  const {
    update,
    device: deviceApps,
    catalog,
  } = useAppsSections(state, {
    query: "",
    // FIXME: apparently the fields can be null but useAppsSections types are not expecting that
    appFilter: appFilter!,
    sort: {
      type: sortOptions.type!,
      order: sortOptions.order!,
    },
  });

  const tokens = listTokens();

  const { installed, apps } = state;

  const found = useMemo(
    () =>
      tokens.find(
        token =>
          isCurrencySupported(token.parentCurrency) &&
          (token.name.toLowerCase().includes(query.toLowerCase()) ||
            token.ticker.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, tokens],
  );

  const parentInstalled = useMemo(
    () =>
      found &&
      found.parentCurrency &&
      installed.find(({ name }) => name.toLowerCase() === found.parentCurrency.name.toLowerCase()),
    [found, installed],
  );

  const parent = useMemo(
    () =>
      found &&
      found.parentCurrency &&
      apps.find(({ name }) => name.toLowerCase() === found.parentCurrency.name.toLowerCase()),
    [found, apps],
  );

  const renderNoResults = useCallback(
    () =>
      found && parent ? (
        <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
          <Flex position="relative">
            <AppIcon app={parent} size={48} radius={100} />
            <Flex
              position="absolute"
              bottom={-2}
              right={-2}
              borderWidth={2}
              borderRadius={100}
              borderColor="background.main"
            >
              <AppIcon app={parent} size={18} radius={100} />
            </Flex>
          </Flex>
          <Text color="neutral.c100" fontWeight="medium" variant="h2" mt={6} textAlign="center">
            <Trans
              i18nKey="manager.token.title"
              values={{
                appName: parent.name,
              }}
            />
          </Text>
          <Flex>
            <Text color="neutral.c80" fontWeight="medium" variant="body" pt={6} textAlign="center">
              {parentInstalled ? (
                <Trans
                  i18nKey="manager.token.noAppNeeded"
                  values={{
                    appName: parent.name,
                    tokenName: found.name,
                  }}
                />
              ) : (
                <Trans
                  i18nKey="manager.token.installApp"
                  values={{
                    appName: parent.name,
                    tokenName: found.name,
                  }}
                />
              )}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
          <NoResultsFound />
          <Text color="neutral.c100" fontWeight="medium" variant="h2" mt={6} textAlign="center">
            <Trans i18nKey="manager.appList.noResultsFound" />
          </Text>
          <Flex>
            <Text color="neutral.c80" fontWeight="medium" variant="body" pt={6} textAlign="center">
              <Trans i18nKey="manager.appList.noResultsDesc" />
            </Text>
          </Flex>
        </Flex>
      ),
    [found, parent, parentInstalled],
  );

  const renderRow = useCallback(
    ({ item }: { item: App }) => (
      <AppRow
        app={item}
        state={state}
        dispatch={dispatch}
        setStorageWarning={setStorageWarning}
        optimisticState={optimisticState}
      />
    ),
    [state, dispatch, setStorageWarning, optimisticState],
  );

  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);
  const showFwUpdateBanner = Boolean(latestFirmware);
  const newFwUpdateUxFeatureFlag = useFeature("llmNewFirmwareUpdateUx");

  const renderList = useCallback(
    (items?: App[]) => (
      <FlatList
        data={items}
        ListHeaderComponent={
          <Flex mt={4}>
            <DeviceCard
              distribution={distribution}
              state={state}
              result={result}
              deviceId={deviceId}
              initialDeviceName={initialDeviceName}
              pendingInstalls={pendingInstalls}
              deviceInfo={deviceInfo}
              dispatch={dispatch}
              device={device}
              appList={deviceApps}
              onLanguageChange={onLanguageChange}
            >
              {showFwUpdateBanner && newFwUpdateUxFeatureFlag?.enabled ? (
                <Flex p={6} pb={0}>
                  <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
                </Flex>
              ) : null}
            </DeviceCard>
            <ProviderWarning />
            <Benchmarking state={state} />
            {showFwUpdateBanner && !newFwUpdateUxFeatureFlag?.enabled ? (
              <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
            ) : (
              <AppUpdateAll
                state={state}
                appsToUpdate={update}
                dispatch={dispatch}
                isModalOpened={updateModalOpened}
              />
            )}
            <Flex flexDirection="row" mt={8} mb={6} backgroundColor="background.main">
              <Searchbar searchQuery={query} onQueryUpdate={setQuery} />
              <Flex ml={6}>
                <AppFilter
                  filter={appFilter}
                  setFilter={setFilter}
                  sort={sort}
                  setSort={setSort}
                  order={order}
                  setOrder={setOrder}
                />
              </Flex>
            </Flex>
          </Flex>
        }
        renderItem={renderRow}
        ListEmptyComponent={renderNoResults}
        keyExtractor={item => item.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    ),

    [
      showFwUpdateBanner,
      newFwUpdateUxFeatureFlag?.enabled,
      onBackFromUpdate,
      distribution,
      state,
      result,
      deviceId,
      initialDeviceName,
      pendingInstalls,
      deviceInfo,
      dispatch,
      device,
      deviceApps,
      onLanguageChange,
      update,
      updateModalOpened,
      query,
      appFilter,
      sort,
      order,
      renderRow,
      renderNoResults,
    ],
  );

  return (
    <Flex flex={1} bg="background.main" px={6}>
      <Search
        fuseOptions={{
          threshold: 0.1,
          keys: ["name"],
          shouldSort: false,
        }}
        value={query}
        items={catalog}
        render={renderList}
        renderEmptySearch={renderList}
      />
      <InstalledAppModal
        disable={update && update.length > 0}
        state={state}
        navigation={navigation}
      />
    </Flex>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: TAB_BAR_SAFE_HEIGHT,
  },
});

export default memo<Props>(AppsScreen);
