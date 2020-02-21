import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  VirtualizedList,
} from "react-native";
import ReactNativeModal from "react-native-modal";

import i18next from "i18next";
import { Trans } from "react-i18next";

import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { useSortedFilteredApps } from "@ledgerhq/live-common/lib/apps/filtering";

import SearchIcon from "../../../icons/Search";
import NoResults from "../../../icons/NoResults";
import colors from "../../../colors";
import TextInput from "../../../components/TextInput";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Styles from "../../../navigation/styles";

import AppRow from "../AppsList/AppRow";

import getWindowDimensions from "../../../logic/getWindowDimensions";

const { height } = getWindowDimensions();

type Props = {
  state: State,
  dispatch: Action => void,
  isInstalledView: boolean,
  apps?: App[],
  disabled: boolean,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  currentProgress: *,
  onOpen: () => void,
  onClose: () => void,
};

export default ({
  state,
  dispatch,
  isInstalledView,
  apps,
  disabled,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  currentProgress,
  onOpen,
  onClose,
}: Props) => {
  const textInput = useRef();
  const listRef = useRef();
  const [isOpened, setIsOpen] = useState(false);
  const [depInstall, setDepsInstall] = useState();
  const [depUninstall, setDepsUninstall] = useState();
  const openSearchModal = useCallback(() => {
    setQuery("");
    setIsOpen(true);
    setDepsInstall();
    setDepsUninstall();
  }, []);

  const closeSearchModal = useCallback(deps => {
    setIsOpen(false);
    if (deps) {
      if (deps.dependencies) setDepsInstall(deps);
      else if (deps.dependents) setDepsUninstall(deps);
    }
  }, []);

  const onModalHide = useCallback(() => {
    if (depInstall) setAppInstallWithDependencies(depInstall);
    else if (depUninstall) setAppUninstallWithDependencies(depUninstall);
  });

  const [query, setQuery] = useState(null);
  const clear = useCallback(() => setQuery(""), [setQuery]);

  const filterOptions: FilterOptions = useMemo(
    () => ({
      query,
      installedApps: [],
      type: [],
    }),
    [query],
  );

  const sortedApps: Array<App> = useSortedFilteredApps(
    apps || state.apps,
    filterOptions,
    { type: "marketcap", order: "desc" },
  );

  const NoResult = useMemo(
    () =>
      sortedApps.length <= 0 && (
        <View style={styles.noResult}>
          <View style={styles.noResultIcon}>
            <NoResults color={colors.fog} />
          </View>
          <LText bold style={styles.noResultText}>
            <Trans i18nKey="manager.appList.noResultsFound" />
          </LText>
          <LText style={styles.noResultDesc}>
            <Trans i18nKey="manager.appList.noResultsDesc" />
          </LText>
        </View>
      ),
    [sortedApps.length],
  );

  const renderRow = useCallback(
    ({ item, index }: { item: App, index: number }) => (
      <AppRow
        app={item}
        index={index}
        state={state}
        dispatch={dispatch}
        isInstalledView={isInstalledView}
        animation={false}
        setAppInstallWithDependencies={closeSearchModal}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        currentProgress={
          (currentProgress &&
            currentProgress.appOp.name === item.name &&
            currentProgress.progress) ||
          0
        }
      />
    ),
    [
      state,
      dispatch,
      isInstalledView,
      setAppInstallWithDependencies,
      setAppUninstallWithDependencies,
      currentProgress,
    ],
  );
  const keyExtractor = useCallback((d: App) => String(d.id) + "SEARCH", []);

  const placeholder = useMemo(
    () =>
      !isInstalledView
        ? i18next.t("manager.appList.searchAppsCatalog")
        : i18next.t("manager.appList.searchAppsInstalled"),
    [isInstalledView],
  );

  /** use this on modal show instead of textinput autofocus since we have to wait for the modal to be visible before focusing */
  const focusInput = useCallback(() => {
    if (textInput && textInput.current) textInput.current.focus();
  }, []);

  const onFocus = useCallback(() => {
    if (listRef && listRef.current) {
      listRef.current.scrollToIndex({ index: 0 });
    }
  }, [listRef]);

  return (
    <>
      <Touchable
        activeOpacity={0.5}
        style={styles.searchBarInput}
        onPress={openSearchModal}
        event="ManagerAppSearchModalOpen"
        eventProperties={{ open: true }}
        disabled={disabled}
      >
        <View style={styles.searchBarIcon}>
          <SearchIcon size={16} color={colors.smoke} />
        </View>
        <LText style={styles.searchBarText}>{placeholder}</LText>
      </Touchable>
      <ReactNativeModal
        isVisible={isOpened}
        useNativeDriver
        hideModalContentWhileAnimating
        onBackButtonPress={closeSearchModal}
        onBackdropPress={closeSearchModal}
        coverScreen
        style={styles.modal}
        onModalShow={focusInput}
        onModalWillShow={onOpen}
        onModalHide={onModalHide}
      >
        <View style={{ height, backgroundColor: colors.lightGrey }}>
          <View style={styles.header}>
            <View style={styles.searchBar}>
              <View style={styles.searchBarIcon}>
                <SearchIcon size={16} color={colors.smoke} />
              </View>
              <TextInput
                ref={textInput}
                returnKeyType="search"
                maxLength={50}
                onChangeText={setQuery}
                clearButtonMode="always"
                style={[styles.searchBarText, styles.searchBarInput]}
                placeholder={placeholder}
                placeholderTextColor={colors.smoke}
                onInputCleared={clear}
                onFocus={onFocus}
                value={query}
                numberOfLines={1}
              />
            </View>
            <Touchable
              style={styles.cancelButton}
              onPress={closeSearchModal}
              event="ManagerAppSearchModalClose"
            >
              <LText style={styles.cancelButtonText}>
                <Trans i18nKey="common.cancel" />
              </LText>
            </Touchable>
          </View>
          <SafeAreaView style={styles.searchList}>
            <VirtualizedList
              listKey="SEARCH"
              keyExtractor={keyExtractor}
              data={sortedApps}
              renderItem={renderRow}
              initialNumToRender={10}
              getItem={(d, i) => d[i]}
              getItemCount={() => sortedApps.length}
            />
          </SafeAreaView>
          {NoResult}
        </View>
      </ReactNativeModal>
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    height,
    justifyContent: "flex-start",
    margin: 0,
  },
  header: {
    ...Styles.headerNoShadow,
    width: "100%",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 24 : 0,
    height: Platform.OS === "ios" ? 74 : 54,
    flexDirection: "row",
    backgroundColor: colors.white,
  },
  searchBar: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.lightGrey,
    borderRadius: 3,
    paddingRight: Platform.OS === "ios" ? 0 : 44,
  },
  searchBarIcon: {
    flexBasis: 44,
    flexGrow: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarInput: {
    flexGrow: 1,
    flexDirection: "row",
    height: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.lightGrey,
    borderRadius: 3,
  },
  searchBarText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 17,
    color: colors.smoke,
  },
  searchBarTextInput: {
    height: 44,
  },
  cancelButton: {
    flexBasis: "auto",
    width: "auto",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 16,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: colors.smoke,
    fontSize: 14,
  },
  searchList: {
    flex: 1,
    width: "100%",
    paddingBottom: Platform.OS === "ios" ? 74 : 54,
  },
  noResult: {
    position: "absolute",
    top: 54,
    left: 0,
    width: "100%",
    height: height / 2,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  noResultIcon: {
    marginLeft: 25,
    marginVertical: 25,
  },
  noResultText: {
    fontSize: 17,
    lineHeight: 21,
    color: colors.darkBlue,
    marginBottom: 8,
  },
  noResultDesc: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.grey,
  },
});
