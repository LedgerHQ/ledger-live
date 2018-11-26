// @flow

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { connect } from "react-redux";

import { completeOnboarding } from "../../../actions/settings";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import ScanIllustration from "../assets/ImportDesktopAccounts";

import type { OnboardingStepProps } from "../types";

type Props = OnboardingStepProps & {
  completeOnboarding: () => void,
};

const mapDispatchToProps = {
  completeOnboarding,
};

class OnboardingStepScanQR extends Component<Props> {
  Footer = () => (
    <Button
      type="primary"
      title={<Trans i18nKey="onboarding.stepScanQR.cta" />}
      onPress={this.navigateToQR}
    />
  );

  navigateToQR = () =>
    this.props.navigation.navigate("ImportAccounts", {
      onFinish: async n => {
        n.dismiss();
        this.props.next();
      },
    });

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStepScanQR"
        Footer={this.Footer}
        withNeedHelp
      >
        <View style={styles.hero}>
          <ScanIllustration />
        </View>
        <View style={styles.titleContainer}>
          <LText style={styles.title}>
            <Trans i18nKey="onboarding.stepScanQR.title">
              {"text"}
              <LText style={styles.titleInside} semiBold>
                {"bold text"}
              </LText>
              {"text"}
            </Trans>
          </LText>
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleContainer: {
    paddingHorizontal: 16,
  },
  title: {
    alignSelf: "center",
    width: 300,
    fontSize: 16,
    lineHeight: 24,
    color: colors.smoke,
    textAlign: "center",
  },
  titleInside: {
    color: colors.darkBlue,
  },
});

export default withOnboardingContext(
  connect(
    null,
    mapDispatchToProps,
  )(OnboardingStepScanQR),
);
