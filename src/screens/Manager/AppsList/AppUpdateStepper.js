import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import type { State } from "@ledgerhq/live-common/lib/apps";

import * as Animatable from "react-native-animatable";

import { updateAllProgress } from "@ledgerhq/live-common/lib/apps/logic";

import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import ProgressBar from "../../../components/ProgressBar";
import getWindowDimensions from "../../../logic/getWindowDimensions";

const { width } = getWindowDimensions();

type Props = {
  state: State,
  disabled: boolean,
};

const AppUpdateStepper = ({ state }: Props) => {
  const { colors } = useTheme();
  const { updateAllQueue } = state;
  const updateProgress = updateAllProgress(state);

  if (updateProgress === 1) return null;

  const count = updateAllQueue.length;

  return (
    <Animatable.View
      animation="fadeIn"
      useNativeDriver
      duration={400}
      style={[
        styles.root,
        { backgroundColor: colors.card, borderBottomColor: colors.lightFog },
      ]}
    >
      <View>
        <LText bold style={styles.stepperText} color="live">
          <Trans
            i18nKey="AppAction.update.title"
            count={count}
            values={{
              number: count,
            }}
          />
        </LText>
        <LText style={styles.infoText} color="grey">
          <Trans semiBold i18nKey="AppAction.update.updateWarn" />
        </LText>
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progress}>
          <LText semiBold style={styles.progressText} color="live">
            <Trans i18nKey="AppAction.update.progress" />
          </LText>
          <View style={styles.progressBar}>
            <ProgressBar
              height={6}
              progress={updateProgress * 100}
              progressColor={colors.live}
            />
          </View>
        </View>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 64,
    width,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    marginRight: 6,
  },
  stepperText: {
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
    paddingVertical: 4,
    textAlign: "right",
    width: "100%",
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 6,
    marginBottom: 10,
  },
  progressSection: {
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
});

export default AppUpdateStepper;
