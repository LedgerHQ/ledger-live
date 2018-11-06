// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { withNavigation } from "react-navigation";

import colors from "../../colors";
import LText from "../../components/LText";
import { withOnboardingContext } from "./onboardingContext";
import STEPS_BY_MODE from "./steps";

import type { OnboardingStepProps } from "./types";

type Props = OnboardingStepProps & {
  stepId: string,
};

const backHitslop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class OnboardingHeader extends PureComponent<Props> {
  render() {
    const { mode, stepId, prev, t } = this.props;
    const steps = STEPS_BY_MODE[mode];
    const visibleSteps = steps.filter(s => !s.isGhost);
    const indexInSteps = visibleSteps.findIndex(s => s.id === stepId);
    const stepMsg = `${indexInSteps + 1} of ${visibleSteps.length}`; // TODO translate
    return (
      <View style={styles.root}>
        <TouchableOpacity
          style={styles.arrow}
          onPress={prev}
          hitSlop={backHitslop}
        />
        <LText semiBold style={styles.steps}>
          {stepMsg}
        </LText>
        <LText secondary semiBold style={styles.title}>
          {t(`onboarding.stepsTitles.${stepId}`)}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  arrow: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.lightFog,
    marginBottom: 16,
  },
  steps: {
    color: colors.grey,
    fontSize: 12,
  },
  title: {
    color: colors.darkBlue,
    fontSize: 24,
    lineHeight: 36,
  },
});

export default withNavigation(withOnboardingContext(OnboardingHeader));
