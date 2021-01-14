import React, { memo, useMemo, useCallback } from "react";

import { View, StyleSheet } from "react-native";

import type { App } from "@ledgerhq/live-common/lib/types/manager";

import type { State, Action } from "@ledgerhq/live-common/lib/apps";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/lib/apps/react";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
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

  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.item,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.lightFog,
          },
        ]}
      >
        <AppIcon icon={icon} />
        <View style={styles.labelContainer}>
          <LText numberOfLines={1} bold>
            {name}
          </LText>
          <LText numberOfLines={1} style={styles.versionText} color="grey">
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
              color="grey"
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
            color={notEnoughMemoryToInstall ? "lightOrange" : "grey"}
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
    borderRadius: 0,
    height: 64,
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
  },
  sizeText: {
    fontSize: 12,
    width: 44,
    marginHorizontal: 10,
  },
  warnText: {
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

export default memo(AppRow);
