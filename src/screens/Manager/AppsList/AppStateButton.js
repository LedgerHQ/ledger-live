import React, { useCallback, useMemo, memo } from "react";
import { StyleSheet, View } from "react-native";

import { Trans } from "react-i18next";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { isEqual } from "lodash";
import AppInstallButton from "./AppInstallButton";
import AppUninstallButton from "./AppUninstallButton";

import {
  InstallProgress,
  UninstallProgress,
  UpdateProgress,
} from "./AppInstallProgress";

import colors from "../../../colors";
import Check from "../../../icons/Check";
import LText from "../../../components/LText";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  notEnoughMemoryToInstall: boolean,
  isInstalled: boolean,
  isInstalledView: boolean,
};

const AppStateButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
  isInstalled,
  isInstalledView,
}: Props) => {
  const { installed, installQueue, uninstallQueue } = state;
  const { name } = app;

  const installing = useMemo(() => installQueue.indexOf(name) >= 0, [
    installQueue,
    name,
  ]);
  const uninstalling = useMemo(() => uninstallQueue.indexOf(name) >= 0, [
    uninstallQueue,
    name,
  ]);

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [app.name, installed],
  );

  const installApp = useCallback(() => {
    dispatch({ type: "install", name });
  }, [dispatch, name]);

  const uninstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
  }, [dispatch, name]);

  const onCancelUninstall = useMemo(
    () => (uninstallQueue.indexOf(name) === 0 ? null : installApp),
    [uninstallQueue, name, installApp],
  );

  const renderAppState = () => {
    switch (true) {
      case installing && uninstalling:
        return <UpdateProgress />;
      case installing:
        return <InstallProgress onCancel={uninstallApp} name={name} />;
      case uninstalling:
        return <UninstallProgress onCancel={onCancelUninstall} name={name} />;
      case isInstalledView && isInstalled:
        return (
          <AppUninstallButton app={app} state={state} dispatch={dispatch} />
        );
      case canUpdate:
        return (
          <View style={styles.installedLabel}>
            <LText
              semiBold
              style={[styles.appStateText, styles.updateText]}
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
    color: colors.live,
    textAlign: "right",
  },
  installedText: {
    paddingLeft: 8,
    color: colors.green,
  },
});

export default memo(AppStateButton, isEqual);
