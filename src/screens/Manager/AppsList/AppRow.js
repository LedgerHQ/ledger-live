import React, { memo, useMemo, useCallback } from "react";

import { View, StyleSheet } from "react-native";

import type { App } from "@ledgerhq/live-common/lib/types/manager";

import type { State, Action } from "@ledgerhq/live-common/lib/apps";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/lib/apps/react";
import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Warning from "../../../icons/Warning";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";
import ByteSize from "../../../components/ByteSize";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  isInstalledView: boolean,
  currentProgress: number,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  setStorageWarning: () => void,
  managerTabs: *,
};

const AppRow = ({
  app,
  state,
  dispatch,
  isInstalledView,
  currentProgress,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
}: Props) => {
  const { name, bytes, icon, version: appVersion } = app;
  const { installed } = state;

  const isInstalled = useMemo(() => installed.find(i => i.name === name), [
    installed,
    name,
  ]);

  const version = (isInstalled && isInstalled.version) || appVersion;
  const availableVersion =
    (isInstalled && isInstalled.availableVersion) || appVersion;

  const notEnoughMemoryToInstall = useNotEnoughMemoryToInstall(state, name);

  const onSizePress = useCallback(() => setStorageWarning(name), [
    setStorageWarning,
    name,
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.item}>
        <AppIcon icon={icon} />
        <View style={styles.labelContainer}>
          <LText numberOfLines={1} bold>
            {name}
          </LText>
          <LText numberOfLines={1} style={styles.versionText}>
            {version}{" "}
            {isInstalled && !isInstalled.updated && (
              <Trans
                i18nKey="manager.appList.versionNew"
                values={{
                  newVersion:
                    availableVersion !== version ? ` ${availableVersion}` : "",
                }}
              />
            )}
          </LText>
        </View>
        {!isInstalled && notEnoughMemoryToInstall ? (
          <Touchable
            activeOpacity={0.5}
            onPress={onSizePress}
            style={styles.warnText}
            event="ManagerAppNotEnoughMemory"
            eventProperties={{ appName: name }}
          >
            <Warning size={16} color={colors.lightOrange} />
            <LText
              semiBold
              style={[styles.versionText, styles.sizeText, styles.warnText]}
            >
              <ByteSize value={bytes} deviceModel={state.deviceModel} />
            </LText>
          </Touchable>
        ) : (
          <LText
            style={[
              styles.versionText,
              styles.sizeText,
              notEnoughMemoryToInstall ? styles.warnText : {},
            ]}
          >
            <ByteSize value={bytes} deviceModel={state.deviceModel} />
          </LText>
        )}
        <AppStateButton
          app={app}
          state={state}
          dispatch={dispatch}
          notEnoughMemoryToInstall={notEnoughMemoryToInstall}
          isInstalled={!!isInstalled}
          isInstalledView={isInstalledView}
          currentProgress={currentProgress}
          setAppInstallWithDependencies={setAppInstallWithDependencies}
          setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 64,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 0,
    height: 64,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "40%",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.grey,
  },
  sizeText: {
    fontSize: 12,
    width: 44,
    marginHorizontal: 10,
  },
  warnText: {
    color: colors.lightOrange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  installedLabel: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 10,
  },
  installedText: {
    paddingLeft: 10,
    color: colors.green,
  },
  appButton: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "flex-start",
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 5,
  },
});

export default memo(
  AppRow,
  (
    {
      currentProgress: _currentProgress,
      visible: _visible,
      state: { installQueue: _installQueue, uninstallQueue: _uninstallQueue },
    },
    { currentProgress, visible, state: { installQueue, uninstallQueue } },
  ) => {
    /** compare _prev to next props that if different should trigger a rerender */
    return (
      visible === _visible &&
      currentProgress === _currentProgress &&
      installQueue.length === _installQueue.length &&
      uninstallQueue.length === _uninstallQueue.length
    );
  },
);
