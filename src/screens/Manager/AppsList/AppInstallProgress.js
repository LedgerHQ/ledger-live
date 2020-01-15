import React, { useCallback, useMemo, useContext } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";

import { Trans } from "react-i18next";

import { ManagerProgressContext } from "../shared";

import colors from "../../../colors";
import CloseCircle from "../../../icons/CloseCircle";
import LText from "../../../components/LText";
import ProgressBar from "../../../components/ProgressBar";
import InfiniteProgressBar from "../../../components/InfiniteProgressBar";

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

  const cancelInstall = useCallback(() => canCancel && onCancel(), [
    canCancel,
    onCancel,
  ]);

  return (
    <TouchableOpacity
      style={styles.progressContainer}
      onPress={cancelInstall}
      underlayColor={colors.lightFog}
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
    </TouchableOpacity>
  );
};

export const UninstallProgress = ({ onCancel }: InstallProgressProps) => {
  return (
    <TouchableOpacity
      style={styles.progressContainer}
      onPress={onCancel}
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
    </TouchableOpacity>
  );
};

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
