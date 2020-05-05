// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import colors from "../../colors";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import IconArrowLeft from "../../icons/ArrowLeft";
import HelpLink from "../../components/HelpLink";
import { useNavigationInterceptor } from "./onboardingContext";
import getStep from "./steps";
import { deviceNames } from "../../wording";
import type { OnboardingStepProps } from "./types";

type Props = OnboardingStepProps & {
  stepId: string,
  withSkip?: boolean,
  withNeedHelp?: boolean,
  titleOverride?: string,
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

export default function OnboardingHeader({
  stepId,
  withSkip,
  withNeedHelp,
  titleOverride,
}: Props) {
  const { next, prev, mode, firstTimeOnboarding } = useNavigationInterceptor();
  const { t } = useTranslation();

  const steps = getStep(mode, firstTimeOnboarding);
  const visibleSteps = steps.filter(s => !s.isGhost);
  const indexInSteps = visibleSteps.findIndex(s => s.id === stepId);
  const stepMsg = t("onboarding.stepCount", {
    current: indexInSteps + 1,
    total: visibleSteps.length,
  });

  let stepIdOverride = stepId;
  if (mode === "restore" && stepId === "OnboardingStepWriteRecovery") {
    stepIdOverride = "OnboardingStepWriteRecoveryRestore";
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerHeader}>
        <Touchable
          event="OnboardingBack"
          style={styles.arrow}
          onPress={prev}
          hitSlop={hitSlop}
        >
          <IconArrowLeft size={16} color={colors.grey} />
        </Touchable>
        {withSkip && (
          <Touchable event="OnboardingSkip" onPress={next} hitSlop={hitSlop}>
            <LText style={styles.skip} semiBold>
              {t("common.skip")}
            </LText>
          </Touchable>
        )}
        {withNeedHelp && <HelpLink />}
      </View>
      <LText semiBold style={styles.steps}>
        {stepMsg}
      </LText>
      <LText secondary semiBold style={styles.title}>
        {titleOverride ||
          t(`onboarding.stepsTitles.${stepIdOverride}`, deviceNames.nanoX)}
      </LText>
    </View>
  );
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
