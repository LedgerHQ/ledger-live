import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";

import { Trans } from "react-i18next";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import AppInstallButton from "./AppInstallButton";
import AppUninstallButton from "./AppUninstallButton";

import colors from "../../../colors";
import Check from "../../../icons/Check";
import CloseCircle from "../../../icons/CloseCircle";
import LText from "../../../components/LText";
import ProgressBar from "../../../components/ProgressBar";
import InfiniteProgressBar from "../../../components/InfiniteProgressBar";

type InstallProgressProps = {
  progress: Number,
  onCancel: Function,
  isInstalling: Boolean,
  isUpdating: Boolean,
};

const InstallProgress = memo(
  ({ progress, onCancel, isInstalling, isUpdating }: InstallProgressProps) => {
    const color = isInstalling ? colors.live : colors.alert;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressLabel}>
          <LText semiBold style={[styles.appStateText, { color }]}>
            <Trans
              i18nKey={
                isInstalling
                  ? isUpdating
                    ? "AppAction.update.loading"
                    : "AppAction.install.loading.button"
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
  app: App,
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

  const progress = useMemo(
    () =>
      currentAppOp && currentAppOp.name === name
        ? currentProgress && currentProgress.progress
        : 0,
    [currentAppOp, currentProgress, name],
  );

  const uninstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
  }, [dispatch, name]);

  const updateApp = useCallback(() => {
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
            isUpdating={canUpdate}
          />
        );
      case isInstalledView && isInstalled:
        return (
          <AppUninstallButton app={app} state={state} dispatch={dispatch} />
        );
      case canUpdate:
        return (
          <TouchableOpacity
            style={[styles.installedLabel, { paddingHorizontal: 0 }]}
            activeOpacity={0.5}
            onPress={updateApp}
          >
            <LText semiBold style={styles.updateText}>
              <Trans
                i18nKey="AppAction.update.version"
                values={{ version: app.version }}
              />
            </LText>
            <LText semiBold style={styles.updateText}>
              <Trans i18nKey="AppAction.update.buttonAction" />
            </LText>
          </TouchableOpacity>
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
    flexWrap: "wrap",
  },
  updateText: {
    width: "100%",
    color: colors.live,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "right",
  },
  installedText: {
    paddingLeft: 10,
    color: colors.green,
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
