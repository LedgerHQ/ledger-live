import React, { memo, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";

import { Trans } from "react-i18next";

import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import AppInstallButton from "./AppInstallButton";
import AppUninstallButton from "./AppUninstallButton";

import colors from "../../../colors";
import Check from "../../../icons/Check";
import CloseCircle from "../../../icons/CloseCircle";
import Trash from "../../../icons/Trash";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import ProgressBar from "../../../components/ProgressBar";
import InfiniteProgressBar from "../../../components/InfiniteProgressBar";

type InstallProgressProps = {
  progress: Number,
  onCancel: Function,
  isInstalling: Boolean,
};

const InstallProgress = memo(
  ({ progress, onCancel, isInstalling }: InstallProgressProps) => {
    const color = isInstalling ? colors.live : colors.alert;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressLabel}>
          <LText semiBold style={[styles.appStateText, { color }]}>
            <Trans
              i18nKey={
                isInstalling
                  ? "AppAction.install.loading.button"
                  : "AppAction.uninstall.loading.button"
              }
            />
          </LText>
          {!progress && (
            <TouchableOpacity
              style={styles.progressCloseButton}
              onPress={onCancel}
              underlayColor={colors.lightFog}
            >
              <CloseCircle
                style={styles.progressCloseIcon}
                color={color}
                size={14}
              />
            </TouchableOpacity>
          )}
        </View>
        {isInstalling ? (
          <ProgressBar
            progressColor={color}
            style={styles.progressBar}
            height={6}
            progress={progress * 1e2}
          />
        ) : (
          <InfiniteProgressBar
            progressColor={color}
            style={styles.progressBar}
            height={6}
          />
        )}
      </View>
    );
  },
);

type Props = {
  app: ApplicationVersion,
  state: State,
  dispatch: Action => void,
  notEnoughMemoryToInstall: Boolean,
  isInstalled: Boolean,
  isInstalledView: Boolean,
};

const AppStateButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
  isInstalled,
  isInstalledView,
}: Props) => {
  const {
    installed,
    installQueue,
    uninstallQueue,
    currentAppOp,
    currentProgress,
  } = state;
  const { name } = app;

  const canUpdate = installed.some(
    ({ name, updated }) => name === app.name && !updated,
  );
  const installing = installQueue.indexOf(app.name) >= 0;
  const uninstalling = uninstallQueue.indexOf(app.name) >= 0;
  const progress =
    currentAppOp && currentAppOp.name === app.name
      ? currentProgress && currentProgress.progress
      : 0;

  const uninstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
  }, [dispatch, name]);

  const installApp = useCallback(() => {
    dispatch({ type: "install", name });
  }, [dispatch, name]);

  const renderAppState = () => {
    switch (true) {
      case uninstalling:
      case installing:
        return (
          <InstallProgress
            progress={progress}
            onCancel={uninstallApp}
            isInstalling={installing}
          />
        );
      case isInstalledView && isInstalled:
        return (
          <AppUninstallButton app={app} state={state} dispatch={dispatch} />
        );
      case isInstalled:
        return (
          <View style={styles.installedLabel}>
            <Check color={colors.green} />
            <LText semiBold style={[styles.installedText, styles.appStateText]}>
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
    fontSize: 12,
  },
  installedLabel: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    flexBasis: "auto",
    alignItems: "flex-start",
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 5,
  },
  progressContainer: {
    flexDirection: "column",
    zIndex: 10,
    width: "100%",
    height: 38,
    backgroundColor: colors.white,
  },
  progressLabel: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  progressCloseButton: {
    flexDirection: "row",
    justifyContent: "center",
    width: 28,
  },
  progressBar: { flexShrink: 0, flexGrow: 0, flexBasis: 6 },
});

export default memo(AppStateButton);
