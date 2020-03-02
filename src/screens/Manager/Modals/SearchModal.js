import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Platform,
  VirtualizedList,
  ScrollView,
} from "react-native";
import ReactNativeModal from "react-native-modal";

import i18next from "i18next";
import { Trans } from "react-i18next";

import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { useSortedFilteredApps } from "@ledgerhq/live-common/lib/apps/filtering";

import { listTokens } from "@ledgerhq/live-common/lib/currencies";

import Button from "../../../components/Button";

import SearchIcon from "../../../icons/Search";
import NoResults from "../../../icons/NoResults";
import colors from "../../../colors";
import TextInput from "../../../components/TextInput";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Styles from "../../../navigation/styles";

import AppRow from "../AppsList/AppRow";

import getWindowDimensions from "../../../logic/getWindowDimensions";
import AppIcon from "../AppsList/AppIcon";

const tokens = listTokens();

type PlaceholderProps = {
  query: string,
  addAccount: () => void,
  onInstall: (name: string) => void,
  installed: InstalledItem[],
  apps: App[],
};

const Placeholder = ({
  query,
  addAccount,
  onInstall,
  installed,
  apps,
}: PlaceholderProps) => {
  const found = useMemo(
    () =>
      tokens.find(
        token =>
          token.name.toLowerCase().includes(query.toLowerCase()) ||
          token.ticker.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const parentInstalled = useMemo(
    () =>
      found &&
      found.parentCurrency &&
      installed.find(({ name }) => name === found.parentCurrency.name),
    [found, installed],
  );

  const parent = useMemo(
    () =>
      found &&
      found.parentCurrency &&
      apps.find(({ name }) => name === found.parentCurrency.name),
    [found, apps],
  );

  const install = useCallback(() => parent && onInstall(parent.name), [
    parent,
    onInstall,
  ]);

  return found && parent ? (
    <ScrollView>
      <View style={styles.noResult}>
        <View style={styles.placeholderIcon}>
          <AppIcon icon={parent.icon} size={60} />
        </View>
        {!parentInstalled && (
          <LText semiBold style={styles.noResultText}>
            <Trans
              i18nKey="manager.noAppNeededForToken"
              values={{
                appName: parent.name,
                tokenName: `${found.name} (${found.ticker})`,
              }}
            />
          </LText>
        )}
        <LText style={styles.noResultDesc}>
          <Trans
            i18nKey={
              !parentInstalled
                ? "manager.tokenAppDisclaimer"
                : "manager.tokenAppDisclaimerInstalled"
            }
            values={{
              appName: parent.name,
              tokenName: found.name,
              tokenType: found.tokenType.toUpperCase(),
            }}
          >
            {"placeholder"}
            <LText bold>{"placeholder"}</LText>
            {"placeholder"}
            <LText bold>{"placeholder"}</LText>
          </Trans>
        </LText>
        <View style={styles.placeholderButtons}>
          {!parentInstalled && (
            <Button
              type="primary"
              onPress={install}
              containerStyle={styles.placeholderButton}
              title={
                <Trans
                  i18nKey="manager.intallParentApp"
                  values={{ appName: parent.name }}
                />
              }
            />
          )}
          <Button
            onPress={addAccount}
            type="secondary"
            title={<Trans i18nKey="manager.goToAccounts" />}
            containerStyle={styles.placeholderButton}
          />
        </View>
      </View>
    </ScrollView>
  ) : (
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
  );
};
const { height } = getWindowDimensions();

type Props = {
  state: State,
  dispatch: Action => void,
  isInstalledView: boolean,
  apps?: App[],
  disabled: boolean,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  navigation: *,
};

export default ({
  state,
  dispatch,
  isInstalledView,
  apps,
  disabled,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  navigation,
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
  }, [
    depInstall,
    depUninstall,
    setAppInstallWithDependencies,
    setAppUninstallWithDependencies,
  ]);

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

  const addAccount = useCallback(() => {
    navigation.navigate("AddAccounts");
    setIsOpen(false);
  }, [navigation]);

  const onInstall = useCallback(
    name => {
      dispatch({ type: "install", name });
      setIsOpen(false);
    },
    [dispatch],
  );

  const NoResult = useMemo(
    () =>
      sortedApps.length <= 0 && (
        <Placeholder
          query={query}
          addAccount={addAccount}
          onInstall={onInstall}
          installed={state.installed}
          apps={state.apps}
        />
      ),
    [
      addAccount,
      onInstall,
      query,
      sortedApps.length,
      state.apps,
      state.installed,
    ],
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
        setAppUninstallWithDependencies={closeSearchModal}
      />
    ),
    [state, dispatch, isInstalledView, closeSearchModal],
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
          {NoResult}
          <View style={styles.searchList}>
            <VirtualizedList
              listKey="SEARCH"
              keyExtractor={keyExtractor}
              data={sortedApps}
              renderItem={renderRow}
              initialNumToRender={10}
              getItem={(d, i) => d[i]}
              getItemCount={() => sortedApps.length}
            />
          </View>
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
    paddingTop: Platform.OS === "ios" ? 44 : 0,
    height: Platform.OS === "ios" ? 94 : 54,
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
  },
  noResult: {
    flex: 2,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
    padding: 48,
  },
  noResultIcon: {
    marginLeft: 25,
    marginVertical: 25,
  },
  noResultText: {
    fontSize: 17,
    lineHeight: 21,
    color: colors.darkBlue,
    marginBottom: 16,
    textAlign: "center",
  },
  noResultDesc: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.grey,
    textAlign: "center",
  },
  placeholderIcon: {
    padding: 16,
  },
  placeholderButtons: {
    flexBasis: "auto",
    flexDirection: "column",
    width: "100%",
    alignContent: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  placeholderButton: { height: 48, marginBottom: 16 },
});
