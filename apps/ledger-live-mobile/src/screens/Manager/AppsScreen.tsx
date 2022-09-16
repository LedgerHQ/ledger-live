import React, { useState, useCallback, useMemo, memo } from "react";
import { FlatList, StyleSheet } from "react-native";
import {
  listTokens,
  isCurrencySupported,
} from "@ledgerhq/live-common/currencies/index";
import { distribute, Action, State } from "@ledgerhq/live-common/apps/index";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { useAppsSections } from "@ledgerhq/live-common/apps/react";

import { Text, Flex } from "@ledgerhq/native-ui";

import { Trans } from "react-i18next";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
// eslint-disable-next-line import/no-cycle
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { ManagerTab } from "../../const/manager";

import AppFilter from "./AppsList/AppFilter";

import DeviceCard from "./Device";
import AppRow from "./AppsList/AppRow";

import Searchbar from "./AppsList/Searchbar";

import InstalledAppModal from "./Modals/InstalledAppModal";

import NoResultsFound from "../../icons/NoResultsFound";
import AppIcon from "./AppsList/AppIcon";
import AppUpdateAll from "./AppsList/AppUpdateAll";
import Search from "../../components/Search";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import { TAB_BAR_SAFE_HEIGHT } from "../../components/TabBar/shared";

type Props = {
  state: State;
  dispatch: (_: Action) => void;
  setAppInstallWithDependencies: (_: { app: App; dependencies: App[] }) => void;
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
  setStorageWarning: () => void;
  deviceId: string;
  initialDeviceName: string;
  navigation: any;
  pendingInstalls: boolean;
  deviceInfo: DeviceInfo;
  device: Device;
  searchQuery?: string;
  updateModalOpened?: boolean;
  tab: ManagerTab;
  optimisticState: State;
  result: ListAppsResult;
};

const AppsScreen = ({
  state,
  dispatch,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
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
}: Props) => {
  const distribution = distribute(state);

  const [appFilter, setFilter] = useState("all");
  const [sort, setSort] = useState("marketcap");
  const [order, setOrder] = useState("desc");

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
    appFilter,
    sort: sortOptions,
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
      installed.find(
        ({ name }) =>
          name.toLowerCase() === found.parentCurrency.name.toLowerCase(),
      ),
    [found, installed],
  );

  const parent = useMemo(
    () =>
      found &&
      found.parentCurrency &&
      apps.find(
        ({ name }) =>
          name.toLowerCase() === found.parentCurrency.name.toLowerCase(),
      ),
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
          <Text
            color="neutral.c100"
            fontWeight="medium"
            variant="h2"
            mt={6}
            textAlign="center"
          >
            <Trans
              i18nKey="manager.token.title"
              values={{
                appName: parent.name,
              }}
            />
          </Text>
          <Flex>
            <Text
              color="neutral.c80"
              fontWeight="medium"
              variant="body"
              pt={6}
              textAlign="center"
            >
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
          <Text
            color="neutral.c100"
            fontWeight="medium"
            variant="h2"
            mt={6}
            textAlign="center"
          >
            <Trans i18nKey="manager.appList.noResultsFound" />
          </Text>
          <Flex>
            <Text
              color="neutral.c80"
              fontWeight="medium"
              variant="body"
              pt={6}
              textAlign="center"
            >
              <Trans i18nKey="manager.appList.noResultsDesc" />
            </Text>
          </Flex>
        </Flex>
      ),
    [found, parent, parentInstalled],
  );

  const renderRow = useCallback(
    ({ item }: { item: any }) => (
      <AppRow
        app={item}
        state={state}
        dispatch={dispatch}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        setStorageWarning={setStorageWarning}
        optimisticState={optimisticState}
      />
    ),
    [
      state,
      dispatch,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      setStorageWarning,
      optimisticState,
    ],
  );

  const renderList = useCallback(
    (items: any) => (
      <FlatList
        data={items}
        ListHeaderComponent={
          <>
            <Flex mt={6} mb={8}>
              <Text
                variant={"h1"}
                fontWeight={"medium"}
                color={"neutral.c100"}
                numberOfLines={1}
              >
                <Trans i18nKey="manager.title" />
              </Text>
            </Flex>
            <DeviceCard
              distribution={distribution}
              state={state}
              result={result}
              deviceId={deviceId}
              initialDeviceName={initialDeviceName}
              pendingInstalls={pendingInstalls}
              deviceInfo={deviceInfo}
              setAppUninstallWithDependencies={setAppUninstallWithDependencies}
              dispatch={dispatch}
              device={device}
              appList={deviceApps}
            />
            <Flex mt={6}>
              <FirmwareUpdateBanner />
            </Flex>
            <AppUpdateAll
              state={state}
              appsToUpdate={update}
              dispatch={dispatch}
              isModalOpened={updateModalOpened}
            />
            <Flex
              flexDirection="row"
              mt={8}
              mb={6}
              backgroundColor="background.main"
            >
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
          </>
        }
        renderItem={renderRow}
        ListEmptyComponent={renderNoResults}
        keyExtractor={item => item.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    ),
    [
      appFilter,
      pendingInstalls,
      device,
      deviceId,
      deviceInfo,
      dispatch,
      distribution,
      initialDeviceName,
      order,
      query,
      renderNoResults,
      renderRow,
      result,
      setAppUninstallWithDependencies,
      sort,
      state,
      update,
      updateModalOpened,
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
