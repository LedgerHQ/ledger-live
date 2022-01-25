import React, { useMemo, memo } from "react";
import { StyleSheet, View } from "react-native";

import { Trans } from "react-i18next";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { useTheme } from "@react-navigation/native";
import AppInstallButton from "./AppInstallButton";
import AppUninstallButton from "./AppUninstallButton";

import { InstallProgress, UninstallProgress } from "./AppInstallProgress";

import Check from "../../../icons/Check";
import LText from "../../../components/LText";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  notEnoughMemoryToInstall: boolean,
  isInstalled: boolean,
  isInstalledView: boolean,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
};

const AppStateButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
  isInstalled,
  isInstalledView,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
}: Props) => {
  const { colors } = useTheme();
  const { installed, installQueue, uninstallQueue, updateAllQueue } = state;
  const { name } = app;

  const installing = useMemo(() => installQueue.includes(name), [
    installQueue,
    name,
  ]);

  const updating = useMemo(() => updateAllQueue.includes(name), [
    updateAllQueue,
    name,
  ]);

  const uninstalling = useMemo(() => uninstallQueue.includes(name), [
    uninstallQueue,
    name,
  ]);

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [app.name, installed],
  );

  const renderAppState = () => {
    switch (true) {
      case installing:
        return (
          <InstallProgress
            state={state}
            name={name}
            updating={updating}
            installing={installQueue[0] === name}
          />
        );
      case uninstalling:
        return <UninstallProgress uninstalling={uninstallQueue[0] === name} />;
      case isInstalledView && isInstalled:
        return (
          <AppUninstallButton
            app={app}
            state={state}
            dispatch={dispatch}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
          />
        );
      case canUpdate:
        return (
          <View style={styles.installedLabel}>
            <LText
              semiBold
              style={[styles.appStateText, styles.updateText]}
              color="grey"
              multiline
            >
              <Trans i18nKey="AppAction.update.buttonAction" />
            </LText>
          </View>
        );
      case isInstalled:
        return (
          <View style={[styles.installedLabel, styles.noWrapLabel]}>
            <Check color={colors.green} />
            <LText
              semiBold
              style={[styles.installedText, styles.appStateText]}
              color="green"
              multiline
            >
              {<Trans i18nKey="common.installed" />}
            </LText>
          </View>
        );
      default:
        return (
          <AppInstallButton
            state={state}
            dispatch={dispatch}
            app={app}
            notEnoughMemoryToInstall={notEnoughMemoryToInstall}
            setAppInstallWithDependencies={setAppInstallWithDependencies}
          />
        );
    }
  };

  return <View style={styles.root}>{renderAppState()}</View>;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  appStateText: {
    fontSize: 13,
    lineHeight: 16,
  },
  installedLabel: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    alignContent: "center",
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 0,
    flexWrap: "wrap",
    height: 38,
  },
  noWrapLabel: {
    flexWrap: "nowrap",
    overflow: "visible",
  },
  updateText: {
    width: "100%",
    textAlign: "right",
  },
  installedText: {
    paddingLeft: 8,
  },
});

export default memo(AppStateButton);
