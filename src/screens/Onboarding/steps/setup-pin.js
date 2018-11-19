// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";

import Button from "../../../components/Button";
import LText from "../../../components/LText";
import DeviceIconBack from "../../../components/DeviceIconBack";
import DeviceNanoAction from "../../../components/DeviceNanoAction";
import DeviceIconCheck from "../../../components/DeviceIconCheck";
import BulletList, { BulletItemText } from "../../../components/BulletList";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import { deviceNames } from "../../../wording";

import type { OnboardingStepProps } from "../types";

// TODO missing feature Pin code – Warning

class OnboardingStepSetupPin extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return (
      <Button
        type="primary"
        title={<Trans i18nKey="common.continue" />}
        onPress={next}
      />
    );
  };

  render() {
    const { mode } = this.props;
    return (
      <OnboardingLayout
        header="OnboardingStepSetupPin"
        Footer={this.Footer}
        noHorizontalPadding
      >
        <View style={styles.hero}>
          <DeviceNanoAction screen="pin" />
        </View>
        <View style={styles.wrapper}>
          <BulletList
            animated
            list={[
              <Trans
                i18nKey="onboarding.stepSetupPin.step1"
                values={deviceNames.nanoX}
              />,
              <Trans
                i18nKey={
                  mode === "restore"
                    ? "onboarding.stepSetupPin.step2-restore"
                    : "onboarding.stepSetupPin.step2"
                }
              >
                {"text"}
                <LText style={{ color: colors.darkBlue }} semiBold>
                  bold text
                </LText>
                {"text"}
              </Trans>,
              <Trans i18nKey="onboarding.stepSetupPin.step3" />,
              () => (
                <View
                  style={{
                    flexWrap: "wrap",
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                >
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4prefix" />
                  </BulletItemText>
                  <DeviceIconCheck />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4suffix1" />
                  </BulletItemText>
                  <View style={{ width: "100%" }} />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4prefix" />
                  </BulletItemText>
                  <DeviceIconBack />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4suffix2" />
                  </BulletItemText>
                </View>
              ),
            ]}
          />
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 60,
    backgroundColor: colors.lightGrey,
    alignItems: "center",
  },
  wrapper: {
    padding: 16,
  },
});

export default withOnboardingContext(OnboardingStepSetupPin);
