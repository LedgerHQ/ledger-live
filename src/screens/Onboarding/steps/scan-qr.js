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
      <OnboardingLayout header="OnboardingStepScanQR" Footer={this.Footer}>
        <View style={styles.hero}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: 10,
            }}
          />
        </View>
        <LText style={styles.title} semiBold>
          <Trans i18nKey="onboarding.stepScanQR.title" />
        </LText>
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
  title: {
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
});

export default withOnboardingContext(
  connect(
    null,
    mapDispatchToProps,
  )(OnboardingStepScanQR),
);
