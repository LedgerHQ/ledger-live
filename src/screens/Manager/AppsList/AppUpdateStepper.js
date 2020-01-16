import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import * as Animatable from "react-native-animatable";
import LText from "../../../components/LText";
import colors from "../../../colors";
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
};

const AppUpdateStepper = ({
  installQueue,
  uninstallQueue,
  appsUpdating,
  onUpdateEnd,
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
    >
      <View>
        <LText bold style={styles.stepperText}>
          <Trans
            i18nKey="AppAction.update.title"
            values={{
              number: appsUpdating.length,
            }}
          />
        </LText>
        <LText style={styles.infoText}>
          <Trans semiBold i18nKey="AppAction.update.updateWarn" />
        </LText>
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progress}>
          <LText semiBold style={styles.progressText}>
            <Trans i18nKey="AppAction.update.progress" />
          </LText>
          <View style={styles.progressBar}>
            <ProgressBar
              height={6}
              progress={updateProgress}
              progressColor={colors.live}
            />
          </View>
        </View>
      </View>
    </AnimatableTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 64,
    width,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightFog,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.grey,
    marginRight: 6,
  },
  stepperText: {
    color: colors.live,
    fontSize: 14,
  },
  progress: {
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
    flex: 1,
  },
  progressText: {
    flexBasis: "auto",
    fontSize: 13,
    lineHeight: 20,
    color: colors.live,
    paddingVertical: 4,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 6,
    marginBottom: 10,
  },
  progressSection: {
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
});

export default AppUpdateStepper;
