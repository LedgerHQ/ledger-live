// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";
import HeaderRightClose from "../../components/HeaderRightClose";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import colors from "../../colors";

type Props = {
  accounts: Account[],
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

type State = {};

class AddAccountsSuccess extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    headerTitle: <StepHeader title="Success" subtitle="step 3 of 4" />,
    headerRight: <HeaderRightClose navigation={navigation} />,
  });

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={4} />
        <LText>success</LText>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default translate()(AddAccountsSuccess);
