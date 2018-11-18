// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { Image, View, StyleSheet } from "react-native";

import { completeOnboarding } from "../../../actions/settings";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import ConfettiParty from "../../../components/ConfettiParty";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";

import type { OnboardingStepProps } from "../types";

type Props = OnboardingStepProps & {
  completeOnboarding: () => void,
};

const mapDispatchToProps = {
  completeOnboarding,
};

const logo = <Image source={require("../../../images/logo.png")} />;

class OnboardingStepFinish extends Component<Props> {
  onFinish = () => {
    this.props.completeOnboarding();
    this.props.resetCurrentStep();
    this.props.navigation.navigate("Main");
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <View style={styles.confettiContainer} pointerEvents="none">
          <ConfettiParty emit={false} />
        </View>
        <OnboardingLayout isCentered style={{ backgroundColor: "transparent" }}>
          <View style={styles.hero}>{logo}</View>
          <LText style={styles.title} secondary semiBold>
            <Trans i18nKey="onboarding.stepFinish.title" />
          </LText>
          <LText style={styles.desc}>
            <Trans i18nKey="onboarding.stepFinish.desc" />
          </LText>
          <Button
            type="primary"
            title={<Trans i18nKey="onboarding.stepFinish.cta" />}
            onPress={this.onFinish}
          />
        </OnboardingLayout>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  title: {
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
  },
  desc: {
    textAlign: "center",
    color: colors.grey,
    fontSize: 14,
    marginBottom: 32,
  },
});

export default withOnboardingContext(
  connect(
    null,
    mapDispatchToProps,
  )(OnboardingStepFinish),
);
