import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import * as Animatable from "react-native-animatable";
import LText from "../../../components/LText";
import colors from "../../../colors";
import Warning from "../../../icons/Warning";
import ProgressBar from "../../../components/ProgressBar";
import getWindowDimensions from "../../../logic/getWindowDimensions";

const { width } = getWindowDimensions();

const AnimatableTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);

type Props = {
  installQueue: string[],
  uninstallQueue: string[],
  appsUpdating: App[],
  onUpdateEnd: () => void,
  onPress: () => void,
};

const AppUpdateStepper = ({
  installQueue,
  uninstallQueue,
  appsUpdating,
  onUpdateEnd,
  onPress,
}: Props) => {
  const updateProgress = useMemo(
    () =>
      Math.round(
        (1e2 *
          (appsUpdating.length * 2 -
            (uninstallQueue.length + installQueue.length))) /
          (appsUpdating.length * 2),
      ) || 0,
    [uninstallQueue, installQueue, appsUpdating],
  );

  const step = useMemo(() => (updateProgress < 50 ? 1 : 2), [updateProgress]);

  useEffect(() => {
    if (updateProgress === 100) {
      onUpdateEnd();
    }
  }, [onUpdateEnd, updateProgress]);

  if (appsUpdating.length <= 0) return null;

  return (
    <AnimatableTouchableOpacity
      animation="fadeIn"
      useNativeDriver
      duration={400}
      style={styles.root}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <View style={{}}>
        <LText bold style={styles.stepperText}>
          <Trans
            i18nKey="AppAction.update.step"
            values={{
              step,
            }}
          />
        </LText>
        <LText style={styles.infoText}>
          <Trans
            i18nKey={
              step === 1
                ? "AppAction.update.removingOldVersions"
                : "AppAction.update.installingUpdates"
            }
          />
        </LText>
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <LText style={[styles.stepperWarn]} multiline>
          <Warning size={11} color={colors.orange} style={styles.warnIcon} />{" "}
          <Trans i18nKey="AppAction.update.updateWarn" />
        </LText>
        <LText style={styles.progressText}>
          <Trans
            i18nKey="AppAction.update.progress"
            values={{
              progress: updateProgress,
            }}
          />
        </LText>
      </View>
      <ProgressBar
        style={styles.progressBar}
        height={4}
        progress={updateProgress}
        progressColor={colors.live}
      />
    </AnimatableTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 60,
    width,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.live,
    marginRight: 6,
  },
  stepperText: {
    color: colors.live,
    fontSize: 16,
    lineHeight: 22,
  },
  stepperWarn: {
    flex: 1,
    color: colors.orange,
    fontSize: 11,
  },
  warnIcon: {
    width: 16,
  },
  progressText: {
    flex: 1,
    fontSize: 11,
    textAlign: "right",
    color: colors.grey,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width,
  },
});

export default AppUpdateStepper;
