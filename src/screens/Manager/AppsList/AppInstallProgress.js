import React, { useMemo, useContext } from "react";
import { StyleSheet, View } from "react-native";

import { Trans } from "react-i18next";

import { ManagerProgressContext } from "../shared";

import colors from "../../../colors";
import CloseCircle from "../../../icons/CloseCircle";
import LText from "../../../components/LText";
import ProgressBar from "../../../components/ProgressBar";
import InfiniteProgressBar from "../../../components/InfiniteProgressBar";
import Touchable from "../../../components/Touchable";

type InstallProgressProps = {
  onCancel: () => void,
  name: string,
};

export const InstallProgress = ({ onCancel, name }: InstallProgressProps) => {
  const { currentProgress } = useContext(ManagerProgressContext);

  const progress = useMemo(
    () =>
      (currentProgress &&
        currentProgress.appOp.name === name &&
        currentProgress.progress) ||
      0,
    [currentProgress, name],
  );

  const canCancel = !progress && !!onCancel;

  return (
    <Touchable
      style={styles.progressContainer}
      onPress={onCancel}
      disabled={canCancel}
      underlayColor={colors.lightFog}
      event="ManagerAppCancelInstall"
      eventProperties={{ appName: name }}
    >
      <View style={styles.progressLabel}>
        <LText
          semiBold
          numberOfLines={1}
          style={[styles.appStateText, { color: colors.live }]}
        >
          <Trans i18nKey="AppAction.install.loading.button" />
        </LText>
        {canCancel && (
          <View style={styles.progressCloseButton}>
            <CloseCircle
              style={styles.progressCloseIcon}
              color={colors.live}
              size={14}
            />
          </View>
        )}
      </View>
      <ProgressBar
        progressColor={colors.live}
        style={styles.progressBar}
        height={6}
        progress={progress * 1e2}
      />
    </Touchable>
  );
};

export const UninstallProgress = ({ onCancel, name }: InstallProgressProps) => {
  return (
    <Touchable
      style={styles.progressContainer}
      onPress={onCancel}
      disabled={!onCancel}
      event="ManagerAppCancelInstall"
      eventProperties={{ appName: name }}
      underlayColor={colors.lightFog}
    >
      <View style={styles.progressLabel}>
        <LText
          semiBold
          numberOfLines={1}
          style={[styles.appStateText, { color: colors.alert }]}
        >
          <Trans i18nKey="AppAction.uninstall.loading.button" />
        </LText>
        {onCancel && (
          <View style={styles.progressCloseButton}>
            <CloseCircle
              style={styles.progressCloseIcon}
              color={colors.alert}
              size={14}
            />
          </View>
        )}
      </View>
      <InfiniteProgressBar
        progressColor={colors.alert}
        style={styles.progressBar}
        height={6}
      />
    </Touchable>
  );
};

export const UpdateProgress = () => (
  <View style={styles.progressContainer}>
    <View style={styles.progressLabel}>
      <LText
        semiBold
        numberOfLines={1}
        style={[styles.appStateText, { color: colors.live }]}
      >
        <Trans i18nKey="AppAction.install.loading.button" />
      </LText>
    </View>
    <InfiniteProgressBar
      progressColor={colors.live}
      style={styles.progressBar}
      height={6}
    />
  </View>
);

const styles = StyleSheet.create({
  appStateText: {
    fontSize: 13,
    lineHeight: 16,
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
    flexWrap: "nowrap",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  progressCloseButton: {
    flexBasis: 28,
    flexDirection: "row",
    justifyContent: "center",
    width: 28,
  },
  progressBar: { flexShrink: 0, flexGrow: 0, flexBasis: 6 },
});
