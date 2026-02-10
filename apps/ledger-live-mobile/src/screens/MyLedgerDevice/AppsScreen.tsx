import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from "react";
import {
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  StyleSheet,
} from "react-native";
import { useSelector } from "~/context/hooks";
import {
  distribute,
  Action,
  State,
  predictOptimisticState,
  reducer,
} from "@ledgerhq/live-common/apps/index";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { useAppsSections } from "@ledgerhq/live-common/apps/react";

import { Text, Flex } from "@ledgerhq/native-ui";

import { Trans } from "~/context/Locale";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppType, SortOptions } from "@ledgerhq/live-common/apps/filtering";
import { useLatestFirmware } from "@ledgerhq/live-common/device/hooks/useLatestFirmware";
import { ManagerTab } from "~/const/manager";

import AppFilter from "./AppsList/AppFilter";

import DeviceCard from "./Device";
import Benchmarking from "./Benchmarking";
import AppRow from "./AppsList/AppRow";

import Searchbar from "./AppsList/Searchbar";

import InstalledAppModal from "./Modals/InstalledAppModal";

import NoResultsFound from "~/icons/NoResultsFound";
import AppUpdateAll from "./AppsList/AppUpdateAll";
import Search from "~/components/Search";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/shared";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import ProviderWarning from "./ProviderWarning";
import { UpdateStep } from "../FirmwareUpdate";
import { useTheme } from "styled-components/native";
import { getEnv } from "@ledgerhq/live-env";
import LedgerSyncEntryPoint from "LLM/features/LedgerSyncEntryPoint";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell";

type Props = {
  state: State;
  dispatch: (_: Action) => void;
  setStorageWarning: (value: string | null) => void;
  deviceId: string;
  initialDeviceName?: string | null;
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

  const renderFooter = useCallback(
    (items?: App[]) => (
      <Flex>
        {items ? null : (
          <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
            <NoResultsFound />
            <Text color="neutral.c100" fontWeight="medium" variant="h2" mt={6} textAlign="center">
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
        )}
      </Flex>
    ),
    [],
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

  const appsToUpdate = getEnv("MOCK_APP_UPDATE") ? deviceApps : update;
  const showAppUpdate = appsToUpdate.length > 0;

  const sectionListRef = useRef<SectionList>(null);

  const { space } = useTheme();

  const headerLayoutRef = useRef<LayoutRectangle | null>(null);

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    headerLayoutRef.current = event.nativeEvent.layout;
  }, []);

  const scrollOffset = useRef(0);
  const onScroll = useCallback(
    ({ nativeEvent: { contentOffset } }: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = contentOffset.y;
    },
    [scrollOffset],
  );

  const scrollToSearchBar = useCallback(() => {
    const minScrollOffset = headerLayoutRef.current?.height ?? 0;
    if (scrollOffset.current > minScrollOffset) return; // avoid scrolling past the search bar if it's already visible
    sectionListRef.current
      ?.getScrollResponder()
      ?.scrollTo({ y: headerLayoutRef.current?.height, animated: true });
  }, []);

  useEffect(() => {
    if (query !== "") scrollToSearchBar();
  }, [query, scrollToSearchBar]);

  useEffect(() => {
    const listener = Keyboard.addListener("keyboardDidShow", scrollToSearchBar);
    return () => listener.remove();
  }, [scrollToSearchBar]);

  const listHeader = useMemo(
    () => (
      <Flex pt={4} pb={8} onLayout={onHeaderLayout} backgroundColor="background.main">
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
          {showFwUpdateBanner ? (
            <Flex p={6} pb={0}>
              <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} fullWidth />
            </Flex>
          ) : null}
          {!showAppUpdate && !showFwUpdateBanner ? (
            <Flex m={6} mb={0}>
              <LedgerSyncEntryPoint entryPoint={EntryPoint.manager} page="Manager" />
              <LNSUpsellBanner location="manager" />
            </Flex>
          ) : null}
        </DeviceCard>
        <ProviderWarning />
        <Benchmarking state={state} />
        {
          <AppUpdateAll
            state={state}
            appsToUpdate={appsToUpdate}
            dispatch={dispatch}
            isModalOpened={updateModalOpened}
          />
        }
      </Flex>
    ),
    [
      appsToUpdate,
      device,
      deviceApps,
      deviceId,
      deviceInfo,
      dispatch,
      distribution,
      initialDeviceName,
      onBackFromUpdate,
      onHeaderLayout,
      onLanguageChange,
      pendingInstalls,
      result,
      showAppUpdate,
      showFwUpdateBanner,
      state,
      updateModalOpened,
    ],
  );

  const renderSearchBar = useCallback(
    () => (
      <Flex flexDirection="row" pb={6} backgroundColor="background.main" columnGap={space[6]}>
        <Searchbar searchQuery={query} onQueryUpdate={setQuery} onFocus={scrollToSearchBar} />
        <AppFilter
          filter={appFilter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
          order={order}
          setOrder={setOrder}
        />
      </Flex>
    ),
    [appFilter, order, query, scrollToSearchBar, sort, space],
  );

  const renderList = useCallback(
    (items?: App[]) => (
      <SectionList
        style={{ width: "100%", height: "100%" }}
        ref={sectionListRef}
        testID="manager-deviceInfo-scrollView"
        sections={[{ data: items ?? [], title: "" }]}
        renderItem={renderRow}
        renderSectionHeader={renderSearchBar}
        stickySectionHeadersEnabled
        onScroll={onScroll}
        ListHeaderComponent={listHeader}
        ListFooterComponent={renderFooter(items)}
        keyExtractor={item => item.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    ),
    [listHeader, onScroll, renderFooter, renderRow, renderSearchBar],
  );

  return (
    <Flex flex={1} bg="background.main" px={6}>
      <Search
        fuseOptions={{
          threshold: 0.1,
          keys: ["name"],
          shouldSort: false,
        }}
        value={query.trim()}
        items={catalog}
        render={renderList}
        renderEmptySearch={renderList}
      />
      <InstalledAppModal disable={update && update.length > 0} state={state} />
    </Flex>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: TAB_BAR_SAFE_HEIGHT,
  },
});

export default memo<Props>(AppsScreen);
