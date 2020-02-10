// @flow
import React, { useState, useCallback, useMemo, useRef, memo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  SafeAreaView,
} from "react-native";
import { distribute } from "@ledgerhq/live-common/lib/apps";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { useSortedFilteredApps } from "@ledgerhq/live-common/lib/apps/filtering";

import { TabView, TabBar } from "react-native-tab-view";
import Animated from "react-native-reanimated";

import i18next from "i18next";
import { Trans } from "react-i18next";

import colors from "../../colors";

import SearchModal from "./Modals/SearchModal";
import AppFilter from "./AppsList/AppFilter";
import UninstallAllButton from "./AppsList/UninstallAllButton";

import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import { track } from "../../analytics";

import DeviceCard from "./Device";
import AppsList from "./AppsList";
import AppUpdateAll from "./AppsList/AppUpdateAll";

const { interpolate, Extrapolate } = Animated;
const { width, height } = Dimensions.get("screen");
const initialLayout = { width, height };

type Props = {
  state: State,
  dispatch: Action => void,
  currentProgress: *,
  setAppInstallWithDependencies: () => void,
  setAppUninstallWithDependencies: () => void,
  setStorageWarning: () => void,
  managerTabs: *,
  deviceId: string,
  initialDeviceName: string,
};

const AppsScreen = ({
  state,
  dispatch,
  currentProgress,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  managerTabs,
  deviceId,
  initialDeviceName,
}: Props) => {
  const { apps, installed, installQueue } = state;
  const distribution = distribute(state);

  const listRef = useRef();

  const [index, setIndex] = useState(0);
  const [routes] = React.useState([
    {
      key: managerTabs.CATALOG,
      title: i18next.t("manager.appsCatalog"),
    },
    {
      key: managerTabs.INSTALLED_APPS,
      title: i18next.t("manager.installedApps"),
      notif: null,
    },
  ]);

  const [filters, setFilters] = useState([]);
  const [sort, setSort] = useState("marketcap");
  const [order, setOrder] = useState("desc");

  const [position] = useState(() => new Animated.Value(0));

  const searchOpacity = interpolate(position, {
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: Extrapolate.CLAMP,
  });

  const [scrollY, setScrollY] = useState(0);

  const onScroll = useCallback(
    evt => setScrollY(evt.nativeEvent.contentOffset.y),
    [setScrollY],
  );

  const scrollToTop = useCallback(() => {
    if (scrollY > 280)
      setTimeout(() => {
        if (listRef.current && listRef.current.scrollToIndex)
          listRef.current.scrollToIndex({ index: 1 });
      }, 100);
  }, [scrollY]);

  const jumpTo = useCallback(
    key => {
      track("ManagerTabBarClick", { tab: key });
      setIndex(key === managerTabs.CATALOG ? 0 : 1);
      scrollToTop();
    },
    [managerTabs.CATALOG, scrollToTop],
  );

  const onIndexChange = useCallback(
    index => {
      track("ManagerTabSwipe", {
        tab: index === 0 ? managerTabs.CATALOG : managerTabs.INSTALLED_APPS,
      });
      setIndex(index);
      scrollToTop();
    },
    [managerTabs.CATALOG, managerTabs.INSTALLED_APPS, scrollToTop],
  );

  const onUninstallAll = useCallback(() => dispatch({ type: "wipe" }), [
    dispatch,
  ]);

  const appsToUpdate = useMemo(
    () =>
      apps.filter(app =>
        installed.some(({ name, updated }) => name === app.name && !updated),
      ),
    [apps, installed],
  );

  const filterOptions = useMemo(
    () => ({
      query: "",
      installedApps: installed,
      type: filters,
    }),
    [installed, filters],
  );
  const sortOptions = useMemo(
    () => ({
      type: sort,
      order,
    }),
    [sort, order],
  );

  const sortedApps: Array<App> = useSortedFilteredApps(
    apps,
    filterOptions,
    sortOptions,
  );

  const distributionOrder = distribution.apps.map(({ name }) => name);

  const installedApps: Array<App> = useSortedFilteredApps(
    apps,
    { type: ["installed"], installedApps: installed, installQueue, query: "" },
    { type: "default", order: "asc" },
  )
    .sort(
      ({ name: _name }, { name }) =>
        distributionOrder.indexOf(_name) > distributionOrder.indexOf(name)
          ? -1
          : 0, // order by distribution in device
    )
    .sort(
      ({ name: _name }, { name }) =>
        installQueue.indexOf(_name) > installQueue.indexOf(name) ? -1 : 0, // place install queue on top of list
    );

  const renderNoResults = useCallback(
    () => (
      <Touchable
        onPress={() => setIndex(0)}
        activeOpacity={0.5}
        style={styles.noAppInstalledContainer}
        event="ManagerNoAppsInstalledClick"
      >
        <LText bold style={styles.noAppInstalledText}>
          <Trans i18nKey="manager.appList.noAppsInstalled" />
        </LText>
        <LText style={styles.noAppInstalledDescription}>
          <Trans i18nKey="manager.appList.noAppsDescription" />
        </LText>
      </Touchable>
    ),
    [setIndex],
  );

  const renderScene = ({ route }: *) => {
    switch (route.key) {
      case managerTabs.CATALOG:
        return (
          <AppsList
            apps={sortedApps}
            state={state}
            dispatch={dispatch}
            active={index === 0}
            currentProgress={currentProgress}
            setAppInstallWithDependencies={setAppInstallWithDependencies}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
            setStorageWarning={setStorageWarning}
          />
        );
      case managerTabs.INSTALLED_APPS:
        return (
          <>
            <AppUpdateAll
              appsToUpdate={appsToUpdate}
              installQueue={state.installQueue}
              uninstallQueue={state.uninstallQueue}
              dispatch={dispatch}
            />
            <View>
              {installedApps && installedApps.length > 0 && (
                <View style={[styles.searchBarContainer]}>
                  <LText style={styles.installedAppsText}>
                    <Trans
                      i18nKey="manager.storage.appsInstalled"
                      values={{ appsInstalled: installedApps.length }}
                    />
                  </LText>
                  <UninstallAllButton onUninstallAll={onUninstallAll} />
                </View>
              )}
            </View>
            <AppsList
              isInstalledView
              apps={installedApps}
              state={state}
              dispatch={dispatch}
              active={index === 1}
              renderNoResults={renderNoResults}
              currentProgress={currentProgress}
              setAppInstallWithDependencies={setAppInstallWithDependencies}
              setAppUninstallWithDependencies={setAppUninstallWithDependencies}
              setStorageWarning={setStorageWarning}
            />
          </>
        );
      default:
        return null;
    }
  };

  const renderLabel = useCallback(
    ({
      route,
      color,
    }: {
      route: { title: String, key: string },
      color: string,
    }) => (
      <View style={styles.labelStyle}>
        <LText
          bold
          style={{
            ...styles.labelStyle,
            color,
          }}
        >
          {route.title}
        </LText>
        {route.key === managerTabs.INSTALLED_APPS && appsToUpdate.length > 0 && (
          <View style={styles.updateBadge}>
            <LText bold style={styles.updateBadgeText}>
              {appsToUpdate.length}
            </LText>
          </View>
        )}
      </View>
    ),
    [appsToUpdate, managerTabs],
  );

  const elements = [
    <DeviceCard
      distribution={distribution}
      state={state}
      deviceId={deviceId}
      initialDeviceName={initialDeviceName}
    />,
    <View>
      <TabBar
        position={position}
        navigationState={{ index, routes }}
        jumpTo={jumpTo}
        style={styles.tabBarStyle}
        indicatorStyle={styles.indicatorStyle}
        tabStyle={styles.tabStyle}
        activeColor={colors.darkBlue}
        inactiveColor={colors.grey}
        labelStyle={styles.labelStyle}
        contentContainerStyle={styles.contentContainerStyle}
        renderLabel={renderLabel}
      />
      <View style={styles.searchBar}>
        <Animated.View
          style={[
            styles.searchBarContainer,
            { opacity: searchOpacity, zIndex: index === 0 ? 2 : -1 },
          ]}
        >
          <SearchModal
            state={state}
            dispatch={dispatch}
            disabled={index !== 0}
          />
          <View style={styles.filterButton}>
            <AppFilter
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
              order={order}
              setOrder={setOrder}
              disabled={index !== 0}
            />
          </View>
        </Animated.View>
        {installedApps.length > 0 && (
          <Animated.View
            style={[
              styles.searchBarContainer,
              styles.searchBarInstalled,
              { opacity: position, zIndex: index === 0 ? -1 : 2 },
            ]}
          >
            <SearchModal
              state={state}
              dispatch={dispatch}
              isInstalledView
              apps={installedApps}
            />
          </Animated.View>
        )}
      </View>
    </View>,
    <TabView
      renderTabBar={() => null}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={onIndexChange}
      initialLayout={initialLayout}
      position={position}
      sceneContainerStyle={{}}
    />,
  ];

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={50}
        data={elements}
        renderItem={({ item }) => item}
        keyExtractor={(_, i) => String(i)}
        stickyHeaderIndices={[1]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  searchBar: {
    width,
    backgroundColor: colors.white,
    height: 64,
  },
  searchBarContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    height: 64,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 0,
  },
  searchBarInstalled: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    width,
  },
  listContainer: {
    width,
  },
  filterButton: {
    height: 64,
    width: 44,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 1,
  },
  indicatorStyle: {
    height: 3,
    backgroundColor: colors.live,
  },
  tabBarStyle: {
    backgroundColor: colors.lightGrey,
    elevation: 0,
  },
  tabStyle: {
    backgroundColor: "transparent",
    width: "auto",
    paddingHorizontal: 16,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  labelStyle: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    textTransform: "capitalize",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 19,
    margin: 0,
    paddingHorizontal: 0,
    textAlign: "left",
  },
  updateBadge: {
    marginTop: 2,
    marginLeft: 8,
    backgroundColor: colors.live,
    minWidth: 15,
    height: 15,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  updateBadgeText: {
    color: colors.white,
    fontSize: 10,
    textAlign: "center",
  },
  contentContainerStyle: {
    marginTop: 16,
    backgroundColor: "transparent",
  },
  installedAppsText: {
    fontSize: 14,
    color: colors.grey,
  },
  noAppInstalledContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 35,
    paddingVertical: 50,
  },
  noAppInstalledText: {
    fontSize: 17,
    lineHeight: 21,
    color: colors.darkBlue,
    marginVertical: 8,
  },
  noAppInstalledDescription: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.grey,
    marginVertical: 8,
    textAlign: "center",
  },
});

export default memo<Props>(AppsScreen);
