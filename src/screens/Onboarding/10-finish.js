// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";
import Button from "../../components/Button";
import OnboardingLayout from "./OnboardingLayout";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: *,
};

class OnboardingStep10Finish extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  onNext = () => {
    this.props.navigation.navigate("Main");
  };

  render() {
    return (
      <OnboardingLayout centered>
        <View style={styles.root}>
          <LText>OnboardingStep10Finish</LText>
          <Button type="primary" title="Next" onPress={this.onNext} />
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    minWidth: 300,
  },
});

export default translate()(OnboardingStep10Finish);
