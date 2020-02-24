import React from "react";
import { StyleSheet, View } from "react-native";

import { Trans } from "react-i18next";

import colors from "../../../colors";
import LText from "../../../components/LText";
import ProgressBar from "../../../components/ProgressBar";
import InfiniteProgressBar from "../../../components/InfiniteProgressBar";

type InstallProgressProps = {
  currentProgress: *,
  installing: boolean,
  updating: boolean,
};

export const InstallProgress = ({
  currentProgress,
  installing,
  updating,
}: InstallProgressProps) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabel}>
        <LText
          semiBold
          numberOfLines={1}
          style={[styles.appStateText, { color: colors.live }]}
        >
          <Trans
            i18nKey={
              updating
                ? "AppAction.update.loading"
                : "AppAction.install.loading.button"
            }
          />
        </LText>
      </View>
      {currentProgress !== 0 && installing ? (
        <ProgressBar
          progressColor={colors.live}
          style={styles.progressBar}
          height={6}
          progress={currentProgress * 1e2}
        />
      ) : (
        <InfiniteProgressBar
          progressColor={colors.live}
          style={styles.progressBar}
          height={6}
        />
      )}
    </View>
  );
};

export const UninstallProgress = () => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabel}>
        <LText
          semiBold
          numberOfLines={1}
          style={[styles.appStateText, { color: colors.live }]}
        >
          <Trans i18nKey="AppAction.uninstall.loading.button" />
        </LText>
      </View>
      <InfiniteProgressBar
        progressColor={colors.live}
        style={styles.progressBar}
        height={6}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  appStateText: {
    fontSize: 13,
    lineHeight: 16,
    width: "100%",
    textAlign: "right",
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
  progressBar: { flexShrink: 0, flexGrow: 0, flexBasis: 6 },
});
