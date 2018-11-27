// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { withNavigation } from "react-navigation";

import colors from "../../colors";
import LText from "../../components/LText";
import IconArrowLeft from "../../icons/ArrowLeft";
import HelpLink from "../../components/HelpLink";
import { withOnboardingContext } from "./onboardingContext";
import STEPS_BY_MODE from "./steps";
import { deviceNames } from "../../wording";
import type { OnboardingStepProps } from "./types";

type Props = OnboardingStepProps & {
  stepId: string,
  withSkip?: boolean,
  withNeedHelp?: boolean,
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class OnboardingHeader extends PureComponent<Props> {
  render() {
    const { mode, stepId, prev, t, withSkip, withNeedHelp, next } = this.props;
    const steps = STEPS_BY_MODE[mode];
    const visibleSteps = steps.filter(s => !s.isGhost);
    const indexInSteps = visibleSteps.findIndex(s => s.id === stepId);
    const stepMsg = `${indexInSteps + 1} of ${visibleSteps.length}`; // TODO translate
    return (
      <View style={styles.root}>
        <View style={styles.headerHeader}>
          <TouchableOpacity
            style={styles.arrow}
            onPress={prev}
            hitSlop={hitSlop}
          >
            <IconArrowLeft size={16} color={colors.grey} />
          </TouchableOpacity>
          {withSkip && (
            <TouchableOpacity onPress={next} hitSlop={hitSlop}>
              <LText style={styles.skip} semiBold>
                {t("common.skip")}
              </LText>
            </TouchableOpacity>
          )}
          {withNeedHelp && <HelpLink />}
        </View>
        <LText semiBold style={styles.steps}>
          {stepMsg}
        </LText>
        <LText secondary semiBold style={styles.title}>
          {t(`onboarding.stepsTitles.${stepId}`, deviceNames.nanoX)}
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
    alignItems: "center",
    justifyContent: "center",
  },
  steps: {
    color: colors.grey,
    fontSize: 14,
  },
  title: {
    color: colors.darkBlue,
    fontSize: 24,
    lineHeight: 36,
  },
  headerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  skip: {
    color: colors.grey,
    fontSize: 16,
  },
  needHelp: {
    marginLeft: 4,
    color: colors.live,
    fontSize: 16,
  },
});

export default withNavigation(withOnboardingContext(OnboardingHeader));
