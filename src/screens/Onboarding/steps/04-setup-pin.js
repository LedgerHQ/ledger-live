// @flow

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";

import Button from "../../../components/Button";
import BulletList from "../../../components/BulletList";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import NanoXPincode from "../assets/NanoXPincode";
import colors from "../../../colors";

import type { OnboardingStepProps } from "../types";

class OnboardingStep04SetupPin extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep04SetupPin"
        Footer={this.Footer}
        noHorizontalPadding
      >
        <View style={styles.hero}>
          <NanoXPincode />
        </View>
        <View style={styles.wrapper}>
          <BulletList
            list={[
              "Turn on your Ledger Nano X.",
              "Press both device buttons to continue.",
              "Press left or right button to select a digit. Press both to validate.",
              "Select ✓ to confirm your PIN code.\nSelect 🔙 to erase a digit.",
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

export default withOnboardingContext(OnboardingStep04SetupPin);
